// Copyright (C) 2016 Sergey Akopkokhyants
// This project is licensed under the terms of the MIT license.
// https://github.com/akserg/ng2-dnd

import {NgModule, ModuleWithProviders} from "@angular/core";

import {DnDConfig} from './dnd.config';
import {DndDraggableComponent,} from './draggable.component';
import {DndListComponent} from './dndlist.component';
import {DnDService, dndServiceFactory} from "./dnd.service";

export * from './abstract.component';
export * from './dnd.config';
export * from './dnd.service';
export * from './draggable.component';
export * from './dndlist.component';


export let providers = [
    DnDConfig,
    {provide: DnDService, useFactory: dndServiceFactory, deps: [DnDConfig]},
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