"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractableImageGenerator = void 0;
var __selfType = requireType("./InteractableImageGenerator");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const ImageGenerator_1 = require("./ImageGenerator");
let InteractableImageGenerator = class InteractableImageGenerator extends BaseScriptComponent {
    onAwake() {
        this.imageGenerator = new ImageGenerator_1.ImageGenerator(this.modelProvider);
        this.createEvent("OnStartEvent").bind(() => {
            this.asrQueryController.onQueryEvent.add((query) => {
                this.createImage(query);
            });
        });
    }
    createImage(prompt) {
        this.textDisplay.text = "Thinking about: " + prompt;
        this.imageGenerator
            .generateImage(prompt)
            .catch((error) => {
            print("Error generating room: " + error);
            this.textDisplay.text = "Error Generating Room";
        });
    }
    __initialize() {
        super.__initialize();
        this.imageGenerator = null;
    }
};
exports.InteractableImageGenerator = InteractableImageGenerator;
exports.InteractableImageGenerator = InteractableImageGenerator = __decorate([
    component
], InteractableImageGenerator);
//# sourceMappingURL=InteractableImageGenerator.js.map