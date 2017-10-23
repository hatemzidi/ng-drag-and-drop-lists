import {Injectable, ElementRef} from '@angular/core';
import {DnDConfig} from './dnd.config';
import {DnDService} from './dnd.service';

//todo(hatem)
//[ ] clean/refactor abstract
//[ ] add dnd.service for some useful functions
//[OK] move consts to config


@Injectable()
export abstract class AbstractComponent {
    _elem: HTMLElement;

    constructor(elemRef: ElementRef,
                public _dndService: DnDService,
                public _config: DnDConfig) {

        this._elem = elemRef.nativeElement;

        this._elem.onclick = (event: Event) => {
            this._onClick(event);
        };

        //
        // Drop events
        //
        this._elem.ondragenter = (event: Event) => {
            this._onDragEnter(event);
        };
        this._elem.ondragover = (event: DragEvent) => {
            this._onDragOver(event);
        };
        this._elem.ondragleave = (event: Event) => {
            this._onDragLeave(event);
        };
        this._elem.ondrop = (event: Event) => {
            this._onDrop(event);
        };

        //
        // Drag events
        //
        this._elem.onmousedown = (event: MouseEvent) => {
            this._onMouseDown(event)
        };
        this._elem.ondragstart = (event: DragEvent) => {
            this._onDragStart(event);
        };

        this._elem.ondragend = (event: Event) => {
            this._onDragEnd(event);
        };
    }

    /**
     * Allows drop on this element
     */
    _dropDisabled: boolean = false;

    get dropDisabled(): boolean {
        return this._dropDisabled;
    }

    /**
     * Whether the object is draggable. Default is true.
     */
    private _dragDisabled: boolean = false;

    set dropDisabled(disabled: boolean) {
        this._dropDisabled = !!disabled;
    }

    get dragDisabled(): boolean {
        return this._dragDisabled;
    }

    set dragDisabled(disabled: boolean) {
        this._dragDisabled = !!disabled;
        this._elem.draggable = !this._dragDisabled;
    }

    public _preventAndStop(event: Event): boolean {
        if (event.preventDefault) {
            event.preventDefault();
        }
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        return true;
    }

    public _stopDragover() {
        // this._placeholder.remove();
        this._elem.querySelector('.dndPlaceholder').remove();
        this._elem.classList.remove("dndDragover");
        return true;
    }


    //**** callbacks ****//
    _onDragEnter(event: Event) {
    }

    _onDragOver(event: Event) {
    }

    _onDragLeave(event: Event) {
    }

    _onDrop(event: Event) {
    }

    _onDragStart(event: Event) {
    }

    _onDragEnd(event: Event) {
    }

    _onMouseDown(event: Event) {
    }

    _onClick(event: Event) {
    }
}


