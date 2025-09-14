

@component
export class ImageGenerator extends BaseScriptComponent {
  @input
  myPrefabAsset: ObjectPrefab;


  private rmm = require("LensStudio:RemoteMediaModule") as RemoteMediaModule;
  public internetModule: InternetModule = require("LensStudio:InternetModule");
  private model: string;


  onAwake() {
    print("running !!!")
    print("shhhh... everything is under the floor boards... it's a secret")
  }


  public moveFurniture (
    id: number,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number; w?: number }
  ) {

    // get the handle for the furniture through a dictionary contained within AssetManager
        // the furniture(s) are 3d models that are ALREADY in the scene
    // move the furniture to the desired position
    // rotate it to the desired rotation
      
  }


  // New function: places a prefab into the scene and optionally sets position/rotation/parent.
  // The implementation attempts common prefab APIs used in Lens Studio environments and falls back safely.
  public placePrefab(
    position?: { x: number; y: number; z: number },
    rotation?: { x: number; y: number; z: number; w?: number }
  ) {
    try {
      print("Prefab asset:" + this.myPrefabAsset);

      if (!this.myPrefabAsset) {
        print("placePrefab: prefab is null");
        return null;
      }

      // ✅ choose where to put it (your script's object, or root as fallback)
      let parent = this.getSceneObject()

      // ✅ instantiate under that parent
      let instance = this.myPrefabAsset.instantiate(parent);


      if (!instance) {
        print("placePrefab: instantiation failed");
        return null;
      }

      print("placePrefab: instance placed, name: " + instance.name);
      return instance;
    } catch (err) {
      print("placePrefab error: " + err);
      return null;
    }
  }

    async generateImage() {
    print("hello i'm running")

    return this.placePrefab({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
  }

}






  // async fetchShopifyItems() {
  //   print("fetching shopify items...");

  //   const fetchPromises = shopifyShops.map((shop) => {
  //     const url = `https://${shop}.myshopify.com/api/2025-07/graphql.json`;
  //     const query = `
  //                     {
  //                       products(first: 15) {
  //                         edges {
  //                           node {
  //                             id
  //                             title
  //                             description
  //                             productType
  //                             handle
  //                             images(first: 3) {
  //                               edges {
  //                                 node {
  //                                   url
  //                                 }
  //                               }
  //                             }
  //                           }
  //                         }
  //                       }
  //                     }
  //                     `;

  //     const headers = {
  //       "Content-Type": "application/json",
  //     };

  //     return this.internetModule
  //       .fetch(url, {
  //         method: "POST",
  //         headers: headers,
  //         body: JSON.stringify({ query })
  //       })
  //       .then(response => response.json())
  //       .then(data => {
  //         this.allShopifyItems.push(...transformShopifyProducts(data));
  //       })
  //       .catch(error => {
  //         print("Error fetching Shopify items:" + error);
  //       });
  //   });

  //   await Promise.all(fetchPromises);

  //   this.allShopifyItems.forEach(e => print(e.title));

  //   // glue the products together to give gemini
  //   productContext = this.allShopifyItems.map(product =>
  //     `ID: ${product.id}, Title: ${product.title}, Description: ${product.description}, Category: ${product.productType}`
  //   ).join('\n');
  // }