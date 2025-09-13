"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const OpenAI_1 = require("Remote Service Gateway.lspkg/HostedExternal/OpenAI");
const Gemini_1 = require("Remote Service Gateway.lspkg/HostedExternal/Gemini");
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
    generateImage(userDesire) {
        this.fetchShopifyItems();
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
                                text: `Given these products:\n${productContext}\n\nAnd the user stating their desires as: "${userDesire}"\n\nPlease recommend the most relevant product IDs that match the user's needs. Return ONLY the product IDs in a comma-separated list.`,
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
            const recommendedProducts = mockShopifyProducts.filter(product => recommendedIds.includes(product.idNumber) // filter by idNumber rather than id because sometimes gemini will  just give number ???
            );
            print("Recommended: " + recommendedProducts.map(e => e.title).join(", "));
        })
            .catch((error) => {
            print('Error: ' + error);
        });
        if (this.model === "OpenAI") {
            return this.generateWithOpenAI(userDesire);
        }
        else {
            return this.generateWithGemini(userDesire);
        }
    }
    fetchShopifyItems() {
        print("fetching shopify items...");
        const url = "https://furnituremaxi.myshopify.com/api/2025-07/graphql.json";
        const query = `
    {
      products(first: 10) {
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
        this.internetModule
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
        this.allShopifyItems.forEach(e => print(e.title));
    }
    generateWithGemini(prompt) {
        return new Promise((resolve, reject) => {
            let request = {
                model: "gemini-2.0-flash-preview-image-generation",
                type: "generateContent",
                body: {
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                            role: "user",
                        },
                    ],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                    },
                },
            };
            Gemini_1.Gemini.models(request)
                .then((response) => {
                if (!response.candidates || response.candidates.length === 0) {
                    reject("No image generated in response");
                    return;
                }
                let foundImage = false;
                for (let part of response.candidates[0].content.parts) {
                    if (part === null || part === void 0 ? void 0 : part.inlineData) {
                        foundImage = true;
                        let b64Data = part.inlineData.data;
                        Base64.decodeTextureAsync(b64Data, (texture) => {
                            resolve(texture);
                        }, () => {
                            reject("Failed to decode texture from base64 data.");
                        });
                        break; // Use the first image found
                    }
                }
                if (!foundImage) {
                    reject("No image data found in response");
                }
            })
                .catch((error) => {
                reject("Error while generating image: " + error);
            });
        });
    }
    generateWithOpenAI(prompt) {
        return new Promise((resolve, reject) => {
            let req = {
                prompt: prompt,
                n: 1,
                model: "dall-e-3",
            };
            OpenAI_1.OpenAI.imagesGenerate(req)
                .then((result) => {
                result.data.forEach((datum) => {
                    let b64 = datum.b64_json;
                    let url = datum.url;
                    if (url) {
                        print("Texture loaded as image URL");
                        let rsm = require("LensStudio:RemoteServiceModule");
                        let resource = rsm.makeResourceFromUrl(url);
                        this.rmm.loadResourceAsImageTexture(resource, (texture) => {
                            resolve(texture);
                        }, () => {
                            reject("Failure to download texture from URL");
                        });
                    }
                    else if (b64) {
                        print("Decoding texture from base64");
                        Base64.decodeTextureAsync(b64, (texture) => {
                            resolve(texture);
                        }, () => {
                            reject("Failure to download texture from base64");
                        });
                    }
                });
            })
                .catch((error) => reject(error));
        });
    }
}
exports.ImageGenerator = ImageGenerator;
// fake shopify furniture
const mockShopifyProducts = [
    {
        id: "gid://shopify/Product/8901234567",
        idNumber: "8901234567",
        title: "Ergonomic Office Chair",
        description: "Adjustable mesh office chair with lumbar support and breathable design",
        price: "$229.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/office-chair.jpg",
        category: "Furniture",
        brand: "WorkEase",
        in_stock: true,
        rating: 4.6
    },
    {
        id: "gid://shopify/Product/9012345678",
        idNumber: "9012345678",
        title: "Minimalist Coffee Table",
        description: "Sleek glass and steel coffee table with a modern low-profile design",
        price: "$199.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/coffee-table.jpg",
        category: "Furniture",
        brand: "UrbanEdge",
        in_stock: true,
        rating: 4.5
    },
    {
        id: "gid://shopify/Product/0123456789",
        idNumber: "0123456789",
        title: "Velvet Accent Chair",
        description: "Plush velvet armchair with gold metal legs for a bold statement piece",
        price: "$349.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/accent-chair.jpg",
        category: "Furniture",
        brand: "ChicHaven",
        in_stock: false,
        rating: 4.9
    },
    {
        id: "gid://shopify/Product/1123456789",
        idNumber: "1123456789",
        title: "Scandinavian Bookshelf",
        description: "Tall open bookshelf with natural wood finish and clean Scandinavian lines",
        price: "$299.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/bookshelf.jpg",
        category: "Furniture",
        brand: "NordicHome",
        in_stock: true,
        rating: 4.8
    },
    {
        id: "gid://shopify/Product/2123456789",
        idNumber: "2123456789",
        title: "Convertible Sleeper Sofa",
        description: "Space-saving sleeper sofa that easily transforms into a queen-size bed",
        price: "$899.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/sleeper-sofa.jpg",
        category: "Furniture",
        brand: "FlexiLiving",
        in_stock: true,
        rating: 4.7
    }
];
// glue the products together to give gemini
const productContext = mockShopifyProducts.map(product => `ID: ${product.id}, Title: ${product.title}, Description: ${product.description}, Price: ${product.price}, Category: ${product.category}, In Stock: ${product.in_stock}`).join('\n');
//# sourceMappingURL=ImageGenerator.js.map