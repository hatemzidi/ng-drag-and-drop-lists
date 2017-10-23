import { NgModule, ModuleWithProviders } from "@angular/core";

import {DragDropConfig} from './dnd.config';
import {DndDraggableComponent,} from './draggable.component';
import {DndListComponent} from './dndlist.component';

export * from './abstract.component';
export * from './dnd.config';

export * from './draggable.component';
export * from './dndlist.component';


export let providers = [
    DragDropConfig,
];

@NgModule({
    declarations: [DndListComponent, DndDraggableComponent],
    exports: [DndListComponent, DndDraggableComponent],

})
export class DndModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DndModule,
            providers: providers
        };
    }
}