import {Injectable} from '@angular/core';
import {DnDConfig} from './dnd.config';

//todo(hatem)
//[ ] store any shared data


export function dndServiceFactory(config: DnDConfig): DnDService {
    return new DnDService(config);
}

@Injectable()
export class DnDService {
    private _elem: HTMLElement;
    public get elem(): HTMLElement {
        return this._elem;
    }

    constructor(private _config: DnDConfig) {
    }


    /**
     * Filters an array of drop effects using a HTML5 effectAllowed string.
     */
    _filterEffects(effects, effectAllowed) {
        if (effectAllowed == 'all') return effects;
        return effects.filter(function (effect) {
            return effectAllowed.toLowerCase().indexOf(effect) != -1;
        });
    }

    /**
     * Given the types array from the DataTransfer object, returns the first valid mime type.
     * A type is valid if it starts with MIME_TYPE, or it equals MSIE_MIME_TYPE or EDGE_MIME_TYPE.
     */
    _getMimeType(types: Array<string>) {
        if (!types) return this._config.MSIE_MIME_TYPE; // IE 9 workaround.
        for (let type of types) {
            if (type == this._config.MSIE_MIME_TYPE || type == this._config.EDGE_MIME_TYPE ||
                type.substr(0, this._config.MIME_TYPE.length) == this._config.MIME_TYPE) {
                return type;
            }
        }
        return null;
    }

    /**
     * Determines the type of the item from the dndState, or from the mime type for items from
     * external sources. Returns undefined if no item type was set and null if the item type could
     * not be determined.
     */
    _getItemType(mimeType: String) {
        //if (this.dndState.isDragging) return dndState.itemType || undefined;
        if (mimeType == this._config.MSIE_MIME_TYPE || mimeType == this._config.EDGE_MIME_TYPE) return null;
        return (mimeType && mimeType.substr(this._config.MIME_TYPE.length + 1)) || undefined;
    }

}
