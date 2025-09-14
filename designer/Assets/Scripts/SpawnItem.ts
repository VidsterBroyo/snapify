// import { AssetManager } from "./AssetManager";

@component
export class SpawnItem extends BaseScriptComponent {
    // @input
    // assetManager: AssetManager;

    spawnItem(PrefabObj: ObjectPrefab, ParentObj, xRow: number, yCol: number) {

        if (PrefabObj) {
            print(PrefabObj.name);
            const instance = PrefabObj.instantiate(ParentObj);

            const normalize = (value: number) => {
                return -200 + (value / 6) * 400; // -300 + fraction * range
            };

            // set position
            instance.getTransform().setLocalPosition(new vec3(normalize(xRow), 0, normalize(yCol)));

        }

    }

    // onAwake() {
    //     if (this.assetManager) {
    //         const prefab = this.assetManager.getPrefabById("2");

    //         this.spawnItem(prefab, this.getSceneObject(), 0, 0);
    //     }
    // }


}