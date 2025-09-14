@component
export class AssetManager extends BaseScriptComponent {
    @input
    prefabs: ObjectPrefab[];


    private prefabMap: { [id: string]: ObjectPrefab } = {};

    public getPrefabById(id: string): ObjectPrefab | undefined {
        return this.prefabMap[id];
    }


    onAwake() {
        for (let i = 0; i < this.prefabs.length; i++) {
            const id = (i + 1).toString();
            this.prefabMap[id] = this.prefabs[i];
        }

        // // Example: instantiate prefab with ID "2"
        // const prefabToSpawn = this.prefabMap["2"];
        // if (prefabToSpawn) {
        //     print(prefabToSpawn.name);
        //     prefabToSpawn.instantiate(this.getSceneObject());
        // }
    }

}