import {Directive, Input, Output, EventEmitter, ElementRef} from '@angular/core';

import {AbstractComponent} from './abstract.component';
import {DnDConfig} from './dnd.config';
import {DnDService} from './dnd.service';

//todo(hatem)
//[OK] manage only callbacks from abstract
//[OK] implement the remaining attributes
//[OK] use config
//[ ] implement a service
//[ ] Fix isDropAllowed
//[ ] migrate event.prevent/stop propagation properly
//[ ] more strict typescript code
//[ ] remove console.*

//[OK] dnd-effect-allowed
//[OK] dnd-type
//[OK] dnd-disable-if

//[OK] dnd-dragstart
//[OK] dnd-moved
//[OK] dnd-copied
//[OK] dnd-linked
//[OK] dnd-canceled
//[OK] dnd-dragend
//[OK] dnd-selected
@Directive({selector: '[dnd-draggable]'})
export class DndDraggableComponent extends AbstractComponent {

    @Input("dnd-effect-allowed") dndEffectAllowed: string;

    @Output("dnd-dragstart") dndDragStart = new EventEmitter();
    @Output("dnd-dragend") dndDragEnd = new EventEmitter();
    @Output("dnd-selected") dndSelected = new EventEmitter();


    private dndState: any = {};

    @Input("dnd-disable-if")
    set draggable(value: boolean) {
        this.dragDisabled = value;
    }

    @Output("dnd-moved") dndMoved = new EventEmitter();
    @Output("dnd-linked") dndLinked = new EventEmitter();
    @Output("dnd-canceled") dndCanceled = new EventEmitter();
    @Output("dnd-copied") dndCopied = new EventEmitter();

    private dndType: string = '';
    private _dndItem: any = {};

    @Input("dnd-type")
    set itemType(value: any) {
        this.dndType = value;
    }

    @Input("dnd-item")
    set dndItem(value: any) {
        this._dndItem = value;
    }

    constructor(elemRef: ElementRef,
                dndService: DnDService,
                config: DnDConfig) {

        super(elemRef, dndService, config);
    }

    _onDragStart(event: MouseEvent) {
        console.info('_onDragStart');

        let that = this;
        let dataTransfer = (event as any).dataTransfer;

        // Check whether the element is draggable, since dragstart might be triggered on a child.
        if (this.dragDisabled) {
            console.warn('drag is disabled');
            return;
        }

        // Initialize global state.
        this.dndState.isDragging = true;
        this.dndState.itemType = this.dndType.toLowerCase();

        // Set the allowed drop effects. See below for special IE handling.
        dataTransfer.dropEffect = "none";
        this.dndState.effectAllowed = this.dndEffectAllowed || this._config.ALL_EFFECTS[0];
        dataTransfer.effectAllowed = this.dndState.effectAllowed;

        // Internet Explorer and Microsoft Edge don't support custom mime types, see design doc:
        // https://github.com/marceljuenemann/angular-drag-and-drop-lists/wiki/Data-Transfer-Design
        let item = this._dndItem;
        let mimeType = this._config.MIME_TYPE + (this.dndState.itemType ? ('-' + this.dndState.itemType) : '');
        try {
            dataTransfer.setData(mimeType, JSON.stringify(item));
        } catch (e) {
            // Setting a custom MIME type did not work, we are probably in IE or Edge.
            let data = JSON.stringify({item: item, type: this.dndState.itemType});
            try {
                dataTransfer.setData(this._config.EDGE_MIME_TYPE, data);
            } catch (e) {
                // We are in Internet Explorer and can only use the Text MIME type. Also note that IE
                // does not allow changing the cursor in the dragover event, therefore we have to choose
                // the one we want to display now by setting effectAllowed.
                let effectsAllowed = this._dndService._filterEffects(this._config.ALL_EFFECTS, this.dndState.effectAllowed);
                dataTransfer.effectAllowed = effectsAllowed[0];
                dataTransfer.setData(this._config.MSIE_MIME_TYPE, data);
            }
        }

        // Try setting a proper drag image if triggered on a dnd-handle (won't work in IE).
        if (dataTransfer.setDragImage) {
            dataTransfer.setDragImage(this._elem, event.offsetX, event.offsetY);
        }

        this._elem.classList.add("dndDragging");
        //review(hatem) ugly but works!
        //review(hatem) try to use requestAnimationFrame
        setTimeout(function () {
            that._elem.classList.add("dndDraggingSource")
        }, 0);

        // fire dndDragStart
        this.dndDragStart.emit({event: event});

        event.stopPropagation();
    }

    _onDragEnd(event: MouseEvent) {
        console.info('_onDragEnd');
        let that = this;

        // fire/eval 'dndCopied', 'dndLinked', 'dndMoved', 'dndCanceled'
        let dropEffect = (event as any).dataTransfer.dropEffect;
        let cb = {copy: 'dndCopied', link: 'dndLinked', move: 'dndMoved', none: 'dndCanceled'};
        this[cb[dropEffect]].emit({event: event});

        // fire dndDragEnd
        this.dndDragEnd.emit({event: event, dropEffect: dropEffect});

        //clean Up
        this.dndState.isDragging = false;
        this._elem.classList.remove("dndDragging");
        setTimeout(function () {
            that._elem.classList.remove("dndDraggingSource")
        }, 0);
    }

    _onClick(event: Event) {
        console.info('_onClick');
        this.dndSelected.emit({event: event});
        this._preventAndStop(event);
    }
}