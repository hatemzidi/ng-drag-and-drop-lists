/**
 * Use the dnd-list attribute to make your list element a dropzone. Usually you will add a single
 * li element as child with the ng-repeat directive. If you don't do that, we will not be able to
 * position the dropped element correctly. If you want your list to be sortable, also add the
 * dnd-draggable directive to your li element(s).
 *
 * Attributes:
 * - dnd-list             Required attribute. The value has to be the array in which the data of
 *                        the dropped element should be inserted. The value can be blank if used
 *                        with a custom dnd-drop handler that always returns true.
 * - dnd-allowed-types    Optional array of allowed item types. When used, only items that had a
 *                        matching dnd-type attribute will be dropable. Upper case characters will
 *                        automatically be converted to lower case.
 * - dnd-effect-allowed   Optional string expression that limits the drop effects that can be
 *                        performed in the list. See dnd-effect-allowed on dnd-draggable for more
 *                        details on allowed options. The default value is all.
 * - dnd-disable-if       Optional boolean expresssion. When it evaluates to true, no dropping
 *                        into the list is possible. Note that this also disables rearranging
 *                        items inside the list.
 * - dnd-horizontal-list  Optional boolean expresssion. When it evaluates to true, the positioning
 *                        algorithm will use the left and right halfs of the list items instead of
 *                        the upper and lower halfs.
 * - dnd-external-sources Optional boolean expression. When it evaluates to true, the list accepts
 *                        drops from sources outside of the current browser tab. This allows to
 *                        drag and drop accross different browser tabs. The only major browser
 *                        that does not support this is currently Microsoft Edge.
 *
 * Callbacks:
 * - dnd-dragover         Optional expression that is invoked when an element is dragged over the
 *                        list. If the expression is set, but does not return true, the element is
 *                        not allowed to be dropped. The following variables will be available:
 *                        - event: The original dragover event sent by the browser.
 *                        - index: The position in the list at which the element would be dropped.
 *                        - type: The dnd-type set on the dnd-draggable, or undefined if non was
 *                          set. Will be null for drops from external sources in IE and Edge,
 *                          since we don't know the type in those cases.
 *                        - dropEffect: One of move, copy or link, see dnd-effect-allowed.
 *                        - external: Whether the element was dragged from an external source.
 *                        - callback: If dnd-callback was set on the source element, this is a
 *                          function reference to the callback. The callback can be invoked with
 *                          custom variables like this: callback({var1: value1, var2: value2}).
 *                          The callback will be executed on the scope of the source element. If
 *                          dnd-external-sources was set and external is true, this callback will
 *                          not be available.
 * - dnd-drop             Optional expression that is invoked when an element is dropped on the
 *                        list. The same variables as for dnd-dragover will be available, with the
 *                        exception that type is always known and therefore never null. There
 *                        will also be an item variable, which is the transferred object. The
 *                        return value determines the further handling of the drop:
 *                        - falsy: The drop will be canceled and the element won't be inserted.
 *                        - true: Signalises that the drop is allowed, but the dnd-drop
 *                          callback already took care of inserting the element.
 *                        - otherwise: All other return values will be treated as the object to
 *                          insert into the array. In most cases you want to simply return the
 *                          item parameter, but there are no restrictions on what you can return.
 *
 * CSS classes:
 * - dndPlaceholder       When an element is dragged over the list, a new placeholder child
 *                        element will be added. This element is of type li and has the class
 *                        dndPlaceholder set. Alternatively, you can define your own placeholder
 *                        by creating a child element with dndPlaceholder class.
 * - dndDragover          Will be added to the list while an element is dragged over the list.
 */

import {Directive, Input, Output, EventEmitter, ElementRef, Renderer2} from '@angular/core';

import {AbstractComponent} from './abstract.component';
import {DnDConfig} from './dnd.config';
import {DnDService} from './dnd.service';


//todo(hatem)
//[OK] manage only callbacks from abstract
//[ ] more reliable placeholder
//[OK] implement the remaining attributes
//[OK] use config
//[OK] implement a service
//[OK] Fix isDropAllowed
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

                //Performance issue in the dragover event
                if (isFirstHalf) {
                    if (<HTMLElement>( listItemNode ).previousSibling != this._placeholder)
                        this.renderer.insertBefore(
                            this._elem,
                            this._placeholder,
                            listItemNode
                        );
                } else {
                    if (<HTMLElement>( listItemNode ).nextSibling != this._placeholder)
                        this.renderer.insertBefore(
                            this._elem,
                            this._placeholder,
                            <HTMLElement>( listItemNode ).nextSibling
                        );
                }


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


        // The drop is definitely going to happen now, store the dropEffect.
        this._dndService.dndState.dropEffect = dropEffect;
        if (!ignoreDataTransfer) {
            dataTransfer.dropEffect = dropEffect;
        }

        this._dropzone.splice(index, 0, droppedItem);

        // Clean up
        this._stopDragover();
        this._preventAndStop(event);
        return false;
    }

    /**
     * Small helper function that cleans up if we aborted a drop.
     */
    private _stopDragover() {
        this._elem.querySelector('.dndPlaceholder').remove();
        this._elem.classList.remove("dndDragover");
        return true;
    }

    /**
     * We use the position of the placeholder node to determine at which position of the array the
     * object needs to be inserted
     */
    private _getPlaceholderIndex() {
        return Array.from(this._elem.children).indexOf(this._placeholder);
    }

    /**
     * Determines which drop effect to use for the given event. In Internet Explorer we have to
     * ignore the effectAllowed field on dataTransfer, since we set a fake value in dragstart.
     * In those cases we rely on dndState to filter effects. Read the design doc for more details:
     * https://github.com/marceljuenemann/angular-drag-and-drop-lists/wiki/Data-Transfer-Design
     */
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

    /**
     * Checks various conditions that must be fulfilled for a drop to be allowed, including the
     * dnd-allowed-types attribute. If the item Type is unknown (null), the drop will be allowed.
     */
    private _isDropAllowed(itemType) {
        if (this.dropDisabled) return false;
        if (!this.dndExternalSources && !this._dndService.dndState.isDragging) return false;
        if (!this._allowedTypes || itemType === null) return true;
        return itemType && this._allowedTypes.indexOf(itemType) != -1;
    }


}


