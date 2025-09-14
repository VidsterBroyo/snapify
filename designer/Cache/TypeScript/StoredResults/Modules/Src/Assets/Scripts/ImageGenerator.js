"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
var __selfType = requireType("./ImageGenerator");
function component(target) { target.getTypeName = function () { return __selfType; }; }
let ImageGenerator = class ImageGenerator extends BaseScriptComponent {
    onAwake() {
        print("running !!!");
        print("shhhh... everything is under the floor boards... it's a secret");
    }
    // New function: places a prefab into the scene and optionally sets position/rotation/parent.
    // The implementation attempts common prefab APIs used in Lens Studio environments and falls back safely.
    placePrefab(position, rotation) {
        try {
            print("Prefab asset:" + this.myPrefabAsset);
            if (!this.myPrefabAsset) {
                print("placePrefab: prefab is null");
                return null;
            }
            // ✅ choose where to put it (your script's object, or root as fallback)
            let parent = this.getSceneObject();
            // ✅ instantiate under that parent
            let instance = this.myPrefabAsset.instantiate(parent);
            if (!instance) {
                print("placePrefab: instantiation failed");
                return null;
            }
            print("placePrefab: instance placed, name: " + instance.name);
            return instance;
        }
        catch (err) {
            print("placePrefab error: " + err);
            return null;
        }
    }
    async generateImage() {
        print("hello i'm running");
        return this.placePrefab({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
    }
    __initialize() {
        super.__initialize();
        this.rmm = require("LensStudio:RemoteMediaModule");
        this.internetModule = require("LensStudio:InternetModule");
    }
};
exports.ImageGenerator = ImageGenerator;
exports.ImageGenerator = ImageGenerator = __decorate([
    component
], ImageGenerator);
//# sourceMappingURL=ImageGenerator.js.map