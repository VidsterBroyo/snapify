"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const OpenAI_1 = require("Remote Service Gateway.lspkg/HostedExternal/OpenAI");
const Gemini_1 = require("Remote Service Gateway.lspkg/HostedExternal/Gemini");
class ImageGenerator {
    constructor(model) {
        this.rmm = require("LensStudio:RemoteMediaModule");
        this.model = model;
    }
    generateImage(userDesire) {
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
        id: "gid://shopify/Product/6789012345",
        idNumber: "6789012345",
        title: "Modern Leather Sofa",
        description: "Luxurious 3-seater sofa with premium Italian leather and solid oak frame",
        price: "$1,299.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/sofa-leather.jpg",
        category: "Furniture",
        brand: "LuxeLiving",
        in_stock: true,
        rating: 4.8
    },
    {
        id: "gid://shopify/Product/7890123456",
        idNumber: "7890123456",
        title: "Rustic Dining Table",
        description: "Handcrafted farmhouse-style dining table made from reclaimed wood",
        price: "$849.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/dining-table-rustic.jpg",
        category: "Furniture",
        brand: "WoodHaven",
        in_stock: true,
        rating: 4.7
    },
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
    },
    {
        id: "gid://shopify/Product/3123456789",
        idNumber: "3123456789",
        title: "Floating TV Stand",
        description: "Wall-mounted TV stand with LED lighting and hidden cable management",
        price: "$279.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/tv-stand.jpg",
        category: "Furniture",
        brand: "VisionSpace",
        in_stock: true,
        rating: 4.6
    },
    {
        id: "gid://shopify/Product/4123456789",
        idNumber: "4123456789",
        title: "Outdoor Patio Set",
        description: "Weather-resistant wicker patio set with cushions and tempered glass table",
        price: "$1,099.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/patio-set.jpg",
        category: "Furniture",
        brand: "SunHaven",
        in_stock: false,
        rating: 4.7
    },
    {
        id: "gid://shopify/Product/5123456789",
        idNumber: "5123456789",
        title: "Industrial Bed Frame",
        description: "Queen-sized bed frame with black steel construction and wood headboard",
        price: "$549.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/bed-frame.jpg",
        category: "Furniture",
        brand: "LoftStyle",
        in_stock: true,
        rating: 4.8
    },
    {
        id: "gid://shopify/Product/6123456789",
        idNumber: "6123456789",
        title: "Smart Standing Desk",
        description: "Height-adjustable desk with touchscreen controls, built-in wireless charger, and memory presets",
        price: "$749.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/standing-desk.jpg",
        category: "Furniture",
        brand: "NextGenWork",
        in_stock: true,
        rating: 4.9
    },
    {
        id: "gid://shopify/Product/7123456789",
        idNumber: "7123456789",
        title: "Hammock Chair Swing",
        description: "Boho-style hanging hammock chair with macramé details and soft cotton cushions",
        price: "$159.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/hammock-chair.jpg",
        category: "Furniture",
        brand: "RelaxNest",
        in_stock: true,
        rating: 4.7
    },
    {
        id: "gid://shopify/Product/8123456789",
        idNumber: "8123456789",
        title: "Rotating Bookshelf Tower",
        description: "360° rotating vertical bookshelf that maximizes storage while staying compact",
        price: "$219.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/bookshelf-rotating.jpg",
        category: "Furniture",
        brand: "SpinRead",
        in_stock: false,
        rating: 4.6
    },
    {
        id: "gid://shopify/Product/9123456789",
        idNumber: "9123456789",
        title: "LED Vanity Mirror Dresser",
        description: "Compact dresser with built-in LED vanity mirror and hidden jewelry storage",
        price: "$529.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/dresser-vanity.jpg",
        category: "Furniture",
        brand: "GlowSpace",
        in_stock: true,
        rating: 4.8
    },
    {
        id: "gid://shopify/Product/10123456789",
        idNumber: "10123456789",
        title: "Japanese Floor Futon Set",
        description: "Traditional tatami mat with foldable futon mattress for minimalist living",
        price: "$399.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/futon.jpg",
        category: "Furniture",
        brand: "ZenHaven",
        in_stock: true,
        rating: 4.7
    },
    {
        id: "gid://shopify/Product/11123456789",
        idNumber: "11123456789",
        title: "Convertible Gaming Recliner",
        description: "Ergonomic recliner with adjustable footrest, RGB lighting, and built-in cup holders",
        price: "$649.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/gaming-recliner.jpg",
        category: "Furniture",
        brand: "GamerLounge",
        in_stock: true,
        rating: 4.9
    },
    {
        id: "gid://shopify/Product/12123456789",
        idNumber: "12123456789",
        title: "Aquarium Coffee Table",
        description: "Glass coffee table with built-in freshwater aquarium base for a living centerpiece",
        price: "$1,199.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/aquarium-table.jpg",
        category: "Furniture",
        brand: "AquaDesigns",
        in_stock: false,
        rating: 4.8
    },
    {
        id: "gid://shopify/Product/13123456789",
        idNumber: "13123456789",
        title: "Foldaway Murphy Bed Desk",
        description: "Space-saving Murphy bed that folds up into a wall-mounted desk",
        price: "$1,499.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/murphy-bed-desk.jpg",
        category: "Furniture",
        brand: "CompactLiving",
        in_stock: true,
        rating: 4.7
    },
    {
        id: "gid://shopify/Product/14123456789",
        idNumber: "14123456789",
        title: "Glow-in-the-Dark Nightstand",
        description: "Minimalist nightstand with subtle glow-in-the-dark accents for ambient lighting",
        price: "$189.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/nightstand-glow.jpg",
        category: "Furniture",
        brand: "LumiHome",
        in_stock: true,
        rating: 4.6
    },
    {
        id: "gid://shopify/Product/15123456789",
        idNumber: "15123456789",
        title: "Curved Glass Workstation",
        description: "Futuristic curved glass desk with built-in cable management and sleek aluminum frame",
        price: "$899.99",
        image_url: "https://cdn.shopify.com/s/files/1/0123/4567/products/glass-desk.jpg",
        category: "Furniture",
        brand: "NeoOffice",
        in_stock: true,
        rating: 4.8
    }
];
// glue the products together to give gemini
const productContext = mockShopifyProducts.map(product => `ID: ${product.id}, Title: ${product.title}, Description: ${product.description}, Price: ${product.price}, Category: ${product.category}, In Stock: ${product.in_stock}`).join('\n');
//# sourceMappingURL=ImageGenerator.js.map