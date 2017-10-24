/**
 * Use the dnd-draggable attribute to make your element draggable
 *
 * Attributes:
 * - dnd-draggable      Required attribute. The value has to be an object that represents the data
 *                      of the element. In case of a drag and drop operation the object will be
 *                      serialized and unserialized on the receiving end.
 * - dnd-effect-allowed Use this attribute to limit the operations that can be performed. Valid
 *                      options are "move", "copy" and "link", as well as "all", "copyMove",
 *                      "copyLink" and "linkMove". The semantics of these operations are up to you
 *                      and have to be implemented using the callbacks described below. If you
 *                      allow multiple options, the user can choose between them by using the
 *                      modifier keys (OS specific). The cursor will be changed accordingly,
 *                      expect for IE and Edge, where this is not supported.
 * - dnd-type           Use this attribute if you have different kinds of items in your
 *                      application and you want to limit which items can be dropped into which
 *                      lists. Combine with dnd-allowed-types on the dnd-list(s). This attribute
 *                      must be a lower case string. Upper case characters can be used, but will
 *                      be converted to lower case automatically.
 * - dnd-disable-if     You can use this attribute to dynamically disable the draggability of the
 *                      element. This is useful if you have certain list items that you don't want
 *                      to be draggable, or if you want to disable drag & drop completely without
 *                      having two different code branches (e.g. only allow for admins).
 *
 * Callbacks:
 * - dnd-dragstart      Callback that is invoked when the element was dragged. The original
 *                      dragstart event will be provided in the local event variable.
 * - dnd-moved          Callback that is invoked when the element was moved. Usually you will
 *                      remove your element from the original list in this callback, since the
 *                      directive is not doing that for you automatically. The original dragend
 *                      event will be provided in the local event variable.
 * - dnd-copied         Same as dnd-moved, just that it is called when the element was copied
 *                      instead of moved, so you probably want to implement a different logic.
 * - dnd-linked         Same as dnd-moved, just that it is called when the element was linked
 *                      instead of moved, so you probably want to implement a different logic.
 * - dnd-canceled       Callback that is invoked if the element was dragged, but the operation was
 *                      canceled and the element was not dropped. The original dragend event will
 *                      be provided in the local event variable.
 * - dnd-dragend        Callback that is invoked when the drag operation ended. Available local
 *                      variables are event and dropEffect.
 * - dnd-selected       Callback that is invoked when the element was clicked but not dragged.
 *                      The original click event will be provided in the local event variable.
 * - dnd-callback       Custom callback that is passed to dropzone callbacks and can be used to
 *                      communicate between source and target scopes. The dropzone can pass user
 *                      defined variables to this callback.
 *
 * CSS classes:
 * - dndDragging        This class will be added to the element while the element is being
 *                      dragged. It will affect both the element you see while dragging and the
 *                      source element that stays at it's position. Do not try to hide the source
 *                      element with this class, because that will abort the drag operation.
 * - dndDraggingSource  This class will be added to the element after the drag operation was
 *                      started, meaning it only affects the original element that is still at
 *                      it's source position, and not the "element" that the user is dragging with
 *                      his mouse pointer.
 */
import {Directive, Input, Output, EventEmitter, ElementRef} from '@angular/core';

import {AbstractComponent} from './abstract.component';
import {DnDConfig} from './dnd.config';
import {DnDService} from './dnd.service';

//todo(hatem)
//[OK] manage only callbacks from abstract
//[OK] implement the remaining attributes
//[OK] use config
//[OK] implement a service
//[OK] Fix isDropAllowed
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

        // Initialize state.
        this._dndService.dndState.isDragging = true;
        this._dndService.dndState.itemType = this.dndType.toLowerCase();

        // Set the allowed drop effects. See below for special IE handling.
        dataTransfer.dropEffect = "none";
        this._dndService.dndState.effectAllowed = this.dndEffectAllowed || this._config.ALL_EFFECTS[0];
        dataTransfer.effectAllowed = this._dndService.dndState.effectAllowed;

        // Internet Explorer and Microsoft Edge don't support custom mime types, see design doc:
        // https://github.com/marceljuenemann/angular-drag-and-drop-lists/wiki/Data-Transfer-Design
        let item = this._dndItem;
        let mimeType = this._config.MIME_TYPE + (this._dndService.dndState.itemType ? ('-' + this._dndService.dndState.itemType) : '');
        try {
            dataTransfer.setData(mimeType, JSON.stringify(item));
        } catch (e) {
            // Setting a custom MIME type did not work, we are probably in IE or Edge.
            let data = JSON.stringify({item: item, type: this._dndService.dndState.itemType});
            try {
                dataTransfer.setData(this._config.EDGE_MIME_TYPE, data);
            } catch (e) {
                // We are in Internet Explorer and can only use the Text MIME type. Also note that IE
                // does not allow changing the cursor in the dragover event, therefore we have to choose
                // the one we want to display now by setting effectAllowed.
                let effectsAllowed = this._dndService._filterEffects(this._config.ALL_EFFECTS, this._dndService.dndState.effectAllowed);
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
        this._dndService.dndState.isDragging = false;
        this._elem.classList.remove("dndDragging");
        setTimeout(function () {
            that._elem.classList.remove("dndDraggingSource")
        }, 0);
        event.stopPropagation();
    }

    _onClick(event: Event) {
        console.info('_onClick');
        this.dndSelected.emit({event: event});
        this._preventAndStop(event);

        // Prevent triggering dndSelected in parant elements.
        if (this.dragDisabled !== false) {
            event.stopPropagation();
        }

    }
}