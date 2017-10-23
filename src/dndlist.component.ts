import {Directive, Input, Output, EventEmitter, ElementRef, Renderer2} from '@angular/core';

import {AbstractComponent} from './abstract.component';
import {DnDConfig} from './dnd.config';
import {DnDService} from './dnd.service';


//todo(hatem)
//[OK] manage only callbacks from abstract
//[ ] more reliable placeholder
//[OK] implement the remaining attributes
//[OK] use config
//[ ] implement a service
//[ ] Fix isDropAllowed
//[ ] migrate event.prevent/stop propagation properly
//[ ] more strict typescript code
//[ ] remove console.*

//[OK] dnd-allowed-types
//[OK] dnd-effect-allowed
//[OK] dnd-disable-if
//[OK] dnd-horizontal-list
//[OK] dnd-external-sources

//[OK] dnd-dragover
//[OK] dnd-drop
//[KO] dnd-inserted - faulty

@Directive({selector: '[dnd-list]'})
export class DndListComponent extends AbstractComponent {


    @Input("dnd-effect-allowed") dndEffectAllowed: string;
    @Input("dnd-external-sources") dndExternalSources: boolean;
    @Input("dnd-allowed-types") dndAllowedTypes: Array<any>;
    @Input("dnd-dnd-horizontal-list") dndHorizontalList: boolean;

    @Output("dnd-dragover") dndDragOver = new EventEmitter();
    @Output("dnd-drop") dndDrop = new EventEmitter();
    @Output("dnd-inserted") dndInserted = new EventEmitter();

    private _placeholder: HTMLElement;
    private _dropzone: Array<any>;

    constructor(elemRef: ElementRef,
                dndService: DnDService,
                config: DnDConfig,
                private renderer: Renderer2) {

        super(elemRef, dndService, config);
    }

    private _allowedTypes: Array<string>;

    @Input("dnd-disable-if")
    set droppable(value: boolean) {
        this.dropDisabled = !!value;
    }

    get allowedTypes(): Array<string> {
        return this._allowedTypes;
    }

    @Input("dropzone")
    set dropzones(value: Array<any>) {
        this._dropzone = value;
    }

    get dropzones(): Array<any> {
        return this._dropzone;
    }

    set allowedTypes(value: Array<string>) {
        this._allowedTypes = value;
    }

    ngAfterContentInit() {
        //review(hatem) or may be create the placeholder on the fly
        //cloning the placeholder
        this._placeholder = <HTMLElement>this._elem.querySelector('.dndPlaceholder').cloneNode(true);
        //remove the elements from the dom
        this._elem.querySelector('.dndPlaceholder').remove();
        // this._placeholder.remove();
    }

    _onDragEnter(event: MouseEvent) {
        console.info('_onDragEnter');
        let dataTransfer = (event as any).dataTransfer;

        // Calculate list properties, so that we don't have to repeat this on every dragover event.
        let types = this.dndAllowedTypes;
        this._allowedTypes = Array.isArray(types) && types.join('|').toLowerCase().split('|');

        let mimeType = this._dndService._getMimeType(dataTransfer.types);
        if (!mimeType || !this._isDropAllowed(this._dndService._getItemType(mimeType))) return true;
        event.preventDefault();
    }

    _onDragOver(event: MouseEvent) {
        console.info('_onDragOver');

        // Check whether the drop is allowed and determine mime type.
        let mimeType = this._dndService._getMimeType((event as any).dataTransfer.types);
        let itemType = this._dndService._getItemType(mimeType);
        if (!mimeType || !this._isDropAllowed(itemType)) return true;

        // Make sure the placeholder is shown, which is especially important if the list is empty.
        if (this._placeholder.parentNode != this._elem) {
            this._elem.appendChild(this._placeholder);
        }

        if (<HTMLElement>event.target != this._elem) {
            // Try to find the node direct directly below the list node.
            let listItemNode = <HTMLElement>event.target;
            while (( <HTMLElement>( listItemNode ).parentNode ) != this._elem && ( <HTMLElement>( listItemNode ).parentNode )) {
                listItemNode = ( <HTMLElement>( listItemNode ).parentNode );
            }

            if (( <HTMLElement>( listItemNode ).parentNode ) == this._elem && listItemNode != this._placeholder) {
                // If the mouse pointer is in the upper half of the list item element,
                // we position the placeholder before the list item, otherwise after it.
                let rect = (<HTMLElement>( <HTMLElement>event.target )).getBoundingClientRect();
                let isFirstHalf: boolean = false;
                if (this.dndHorizontalList) {
                    isFirstHalf = event.clientX < rect.left + rect.width / 2;
                } else {
                    isFirstHalf = event.clientY < rect.top + rect.height / 2;
                }
                this.renderer.insertBefore(
                    this._elem,
                    this._placeholder,
                    isFirstHalf ? listItemNode : <HTMLElement>( listItemNode ).nextSibling
                );
            }
        }

        // In IE we set a fake effectAllowed in dragstart to get the correct cursor, we therefore
        // ignore the effectAllowed passed in dataTransfer. We must also not access dataTransfer for
        // drops from external sources, as that throws an exception.
        let ignoreDataTransfer = mimeType == this._config.MSIE_MIME_TYPE;
        let dropEffect = this._getDropEffect(event, ignoreDataTransfer);
        if (dropEffect == 'none') return this._stopDragover();

        this.dndDragOver.emit({event: event, dropEffect: dropEffect});

        // Set dropEffect to modify the cursor shown by the browser, unless we're in IE, where this
        // is not supported. This must be done after preventDefault in Firefox.
        event.preventDefault();
        if (!ignoreDataTransfer) {
            (event as any).dataTransfer.dropEffect = dropEffect;
        }

        this._elem.classList.add("dndDragover");
        event.stopPropagation();
    };

    _onDragLeave(event: MouseEvent) {
        console.info('_onDragLeave');

        let newTarget = document.elementFromPoint(event.clientX, event.clientY);
        if (this._elem.contains(newTarget) && !(event as any)._dndPhShown) {
            // Signalize to potential parent lists that a placeholder is already shown.
            (event as any)._dndPhShown = true;
        } else {
            this._stopDragover();
        }
    };

    _onDrop(event: MouseEvent) {
        console.info('_onDrop');
        let dataTransfer = (event as any).dataTransfer;

        // Check whether the drop is allowed and determine mime type.
        let mimeType = this._dndService._getMimeType(dataTransfer.types);
        let itemType = this._dndService._getItemType(mimeType);
        if (!mimeType || !this._isDropAllowed(itemType)) return true;

        // The default behavior in Firefox is to interpret the dropped element as URL and
        // forward to it. We want to prevent that even if our drop is aborted.
        event.preventDefault();

        // Unserialize the data that was serialized in dragstart.
        let droppedItem: any = {};
        try {
            droppedItem = JSON.parse(dataTransfer.getData(mimeType));
        } catch (e) {
            return this._stopDragover();
        }

        // Drops with invalid types from external sources might not have been filtered out yet.
        if (mimeType == this._config.MSIE_MIME_TYPE || mimeType == this._config.EDGE_MIME_TYPE) {
            itemType = droppedItem.type || undefined;
            droppedItem = droppedItem.item;
            if (!this._isDropAllowed(itemType)) return this._stopDragover();
        }

        // Special handling for internal IE drops, see dragover handler.
        let ignoreDataTransfer = mimeType == this._config.MSIE_MIME_TYPE;
        let dropEffect = this._getDropEffect(event, ignoreDataTransfer);
        if (dropEffect == 'none') return this._stopDragover();

        // Invoke the callback, which can transform the transferredObject and even abort the drop.
        let index = this._getPlaceholderIndex();
        this.dndDrop.emit({event: event, dropEffect: dropEffect, index: index, itemType: itemType, item: droppedItem});

        //review(hatem) reverse engineer this, and may be reactivate it
        // The drop is definitely going to happen now, store the dropEffect.
        // this.dndState.dropEffect = dropEffect;
        // if (!ignoreDataTransfer) {
        //     dataTransfer.dropEffect = dropEffect;
        // }

        this._dropzone.splice(index, 0, droppedItem);

        // Clean up
        this._stopDragover();
        this._preventAndStop(event);
        return false;
    }


    private _getPlaceholderIndex() {
        return Array.from(this._elem.children).indexOf(this._placeholder);
    }


    private _getDropEffect(event, ignoreDataTransfer) {
        let effects = this._config.ALL_EFFECTS;
        if (!ignoreDataTransfer) {
            effects = this._dndService._filterEffects(effects, event.dataTransfer.effectAllowed);
        }
        // if (dndState.isDragging) {
        //     effects = filterEffects(effects, dndState.effectAllowed);
        // }
        if (this.dndEffectAllowed) {
            effects = this._dndService._filterEffects(effects, this.dndEffectAllowed);
        }
        // MacOS automatically filters dataTransfer.effectAllowed depending on the modifier keys,
        // therefore the following modifier keys will only affect other operating systems.
        if (!effects.length) {
            return 'none';
        } else if (event.ctrlKey && effects.indexOf('copy') != -1) {
            return 'copy';
        } else if (event.altKey && effects.indexOf('link') != -1) {
            return 'link';
        } else {
            return effects[0];
        }
    }

    private _isDropAllowed(itemType) {
        if (this.dropDisabled) return false;
        if (!this.dndExternalSources) return false;
        if (!this._allowedTypes || itemType === null) return true;
        return itemType && this._allowedTypes.indexOf(itemType) != -1;
    }


}


