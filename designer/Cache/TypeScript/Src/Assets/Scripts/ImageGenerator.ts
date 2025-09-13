import { OpenAI } from "Remote Service Gateway.lspkg/HostedExternal/OpenAI";
import { OpenAITypes } from "Remote Service Gateway.lspkg/HostedExternal/OpenAITypes";
import { Gemini } from "Remote Service Gateway.lspkg/HostedExternal/Gemini";
import { GeminiTypes } from "Remote Service Gateway.lspkg/HostedExternal/GeminiTypes";


type ShopifyAPIResponse = {
  data: {
    products: {
      edges: {
        node: {
          id: string;
          title: string;
          description: string;
          productType: string;
          images: {
            edges: {
              node: {
                url: string;
              };
            }[];
          };
        };
      }[];
    };
  };
};

type FurnitureItem = {
  id: string;
  idNumber: string;
  title: string;
  description: string;
  productType: string;
  image_url: string | null;
};

let productContext: string;
const shopifyShops = ["highfashionhome", "furnituremaxi", "thronekingdom", "chicoryhome", "furnitureofcanada", "furniturebarn", "thegoatwallart", "ruggable", "consciousitems", ]

function transformShopifyProducts(apiResponse: ShopifyAPIResponse): FurnitureItem[] {
  return apiResponse.data.products.edges.map(({ node }) => {
    const idNumber = node.id.split("/").pop() ?? node.id;
    const image_url = node.images.edges[0]?.node.url ?? null;

    return {
      id: node.id,
      idNumber,
      title: node.title,
      description: node.description,
      productType: node.productType,
      image_url,
    };
  });
}

export class ImageGenerator {
  private rmm = require("LensStudio:RemoteMediaModule") as RemoteMediaModule;
  public internetModule: InternetModule = require("LensStudio:InternetModule");
  private model: string;

  private allShopifyItems: FurnitureItem[] = [];

  constructor(model: string) {
    this.model = model;
  }

  async generateImage(userDesire: string): Promise<Texture> {
    await this.fetchShopifyItems();

    return this.generateWithGemini(userDesire);
  }


  async fetchShopifyItems() {
    print("fetching shopify items...");

    const fetchPromises = shopifyShops.map((shop) => {
      const url = `https://${shop}.myshopify.com/api/2025-07/graphql.json`;
      const query = `
                      {
                        products(first: 15) {
                          edges {
                            node {
                              id
                              title
                              description
                              productType
                              handle
                              images(first: 3) {
                                edges {
                                  node {
                                    url
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                      `;

      const headers = {
        "Content-Type": "application/json",
      };

      return this.internetModule
        .fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
          this.allShopifyItems.push(...transformShopifyProducts(data));
        })
        .catch(error => {
          print("Error fetching Shopify items:" + error);
        });
    });

    await Promise.all(fetchPromises);

    this.allShopifyItems.forEach(e => print(e.title));

    // glue the products together to give gemini
    productContext = this.allShopifyItems.map(product =>
      `ID: ${product.id}, Title: ${product.title}, Description: ${product.description}, Category: ${product.productType}`
    ).join('\n');
  }



  private generateWithGemini(userDesire: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      print("generating gemini with the following context:")
      print(productContext)

      let request: GeminiTypes.Models.GenerateContentRequest = {
        model: 'gemini-2.0-flash',
        type: 'generateContent',
        body: {
          contents: [
            {
              parts: [
                {
                  text: `You are a sophisticated algorithm that can recommend furniture for someone based on their desires for the room they have newly moved into.`,
                },
              ],
              role: 'model',
            },
            {
              parts: [
                {
                  text: `Given these products:\n${productContext}\n\nAnd the user stating their desires as: "${userDesire}"\n\nPlease recommend the most relevant product IDs that match the user's needs. Do NOT return multiple of the same type of product. Return ONLY the product IDs (including the leading 'gid://shopify/Product/') in a comma-separated list.`,
                },
              ],
              role: 'user',
            },
          ],
        },
      };

      Gemini.models(request)
        .then((response) => {
          let recommendedIds: string = response.candidates[0].content.parts[0].text
          print(recommendedIds);

          // find only recommended products
          const recommendedProducts = this.allShopifyItems.filter(product =>
            recommendedIds.includes(product.id) // filter by idNumber rather than id because sometimes gemini will just give number ???
          );

          print("Recommended: " + recommendedProducts.map(e => e.title).join(", "))

        })
        .catch((error) => {
          print('Error: ' + error);
        });

    });
  }



}



