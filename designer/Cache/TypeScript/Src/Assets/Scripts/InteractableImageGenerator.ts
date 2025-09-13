import { ImageGenerator } from "./ImageGenerator";
import { ASRQueryController } from "./ASRQueryController";

@component
export class InteractableImageGenerator extends BaseScriptComponent {
  @ui.separator
  @ui.label("Example of using generative image APIs")
  @input
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("OpenAI", "OpenAI"),
      new ComboBoxItem("Gemini", "Gemini"),
    ])
  )
  private modelProvider: string = "OpenAI";
  @ui.separator
  @input
  private textDisplay: Text;
  @input
  private asrQueryController: ASRQueryController;
  
  private imageGenerator: ImageGenerator = null;

  onAwake() {
    this.imageGenerator = new ImageGenerator(this.modelProvider);
    this.createEvent("OnStartEvent").bind(() => {
      this.asrQueryController.onQueryEvent.add((query) => {
        this.createImage(query);
      });
    });
  }

  createImage(prompt: string) {
    this.textDisplay.text = "Imagining... " + prompt;
    this.imageGenerator
      .generateImage(prompt)
      .catch((error) => {
        print("Error generating room: " + error);
        this.textDisplay.text = "Error Generating Room :(";
      });
  }
}
