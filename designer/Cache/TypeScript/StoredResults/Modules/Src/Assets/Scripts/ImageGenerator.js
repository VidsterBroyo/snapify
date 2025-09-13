"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const Gemini_1 = require("Remote Service Gateway.lspkg/HostedExternal/Gemini");
let productContext;
const shopifyShops = ["highfashionhome", "furnituremaxi", "thronekingdom", "chicoryhome", "furnitureofcanada", "furniturebarn", "thegoatwallart", "ruggable", "consciousitems",];
function transformShopifyProducts(apiResponse) {
    return apiResponse.data.products.edges.map(({ node }) => {
        var _a, _b, _c;
        const idNumber = (_a = node.id.split("/").pop()) !== null && _a !== void 0 ? _a : node.id;
        const image_url = (_c = (_b = node.images.edges[0]) === null || _b === void 0 ? void 0 : _b.node.url) !== null && _c !== void 0 ? _c : null;
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
class ImageGenerator {
    constructor(model) {
        this.rmm = require("LensStudio:RemoteMediaModule");
        this.internetModule = require("LensStudio:InternetModule");
        this.allShopifyItems = [];
        this.model = model;
    }
    async generateImage(userDesire) {
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
        productContext = this.allShopifyItems.map(product => `ID: ${product.id}, Title: ${product.title}, Description: ${product.description}, Category: ${product.productType}`).join('\n');
    }
    generateWithGemini(userDesire) {
        return new Promise((resolve, reject) => {
            print("generating gemini with the following context:");
            print(productContext);
            let request = {
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
            Gemini_1.Gemini.models(request)
                .then((response) => {
                let recommendedIds = response.candidates[0].content.parts[0].text;
                print(recommendedIds);
                // find only recommended products
                const recommendedProducts = this.allShopifyItems.filter(product => recommendedIds.includes(product.id) // filter by idNumber rather than id because sometimes gemini will just give number ???
                );
                print("Recommended: " + recommendedProducts.map(e => e.title).join(", "));
            })
                .catch((error) => {
                print('Error: ' + error);
            });
        });
    }
}
exports.ImageGenerator = ImageGenerator;
//# sourceMappingURL=ImageGenerator.js.map