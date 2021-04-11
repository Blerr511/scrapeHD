const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const operationName = 'productClientOnlyProduct';
const query = `

query productClientOnlyProduct(
    $itemId: String!
) {
    product(
        itemId: $itemId
    ) {

        itemId
        dataSources
        identifiers {
            canonicalUrl
            brandName
            itemId
            modelNumber
            productLabel
            storeSkuNumber
            upcGtin13
            specialOrderSku
            toolRentalSkuNumber
            rentalCategory
            rentalSubCategory
            upc
            productType
            isSuperSku
            parentId
            sampleId
            __typename
        }
        availabilityType {
            discontinued
            status
            type
            buyable
            __typename
        }
        details {
            description
            collection {
                url
                collectionId
                __typename
            }
            highlights
            __typename
        }
        media {
            images {
                url
                sizes
                type
                subType
                __typename
            }
            video {
                shortDescription
                thumbnail
                url
                videoStill
                link {
                    text
                    url
                    __typename
                }
                title
                type
                videoId
                longDescription
                __typename
            }
            threeSixty {
                id
                url
                __typename
            }
            augmentedRealityLink {
                usdz
                image
                __typename
            }
            __typename
        }

        reviews {
            ratingsReviews {
                averageRating
                totalReviews
                __typename
            }
            __typename
        }
        seoDescription

        taxonomy {
            breadCrumbs {
                label
                url
                browseUrl
                creativeIconUrl
                deselectUrl
                dimensionName
                refinementKey
                __typename
            }
            brandLinkUrl
            __typename
        }
        favoriteDetail {
            count
            __typename
        }
        specificationGroup{
            specifications {
              specName
              specValue
              __typename
            }
            specTitle
            __typename
          }
        info {
            hidePrice
            ecoRebate
            quantityLimit
            sskMin
            sskMax
            unitOfMeasureCoverage
            wasMaxPriceRange
            wasMinPriceRange
            fiscalYear
            productDepartment
            classNumber
            forProfessionalUseOnly
            globalCustomConfigurator {
                customButtonText
                customDescription
                customExperience
                customExperienceUrl
                customTitle
                __typename
            }
            movingCalculatorEligible
            label
            displayWhatWeOffer
            recommendationFlags {
                visualNavigation
                __typename
            }
            replacementOMSID
            hasSubscription
            isLiveGoodsProduct
            __typename
        }
        pricing {
            value
            alternatePriceDisplay
            original
            message
            specialBuy
            unitOfMeasure
            __typename
        }
        sizeAndFitDetail {
            attributeGroups {
                attributes {
                    attributeName
                    dimensions
                    __typename
                }
                dimensionLabel
                productType
                __typename
            }
            __typename
        }
        keyProductFeatures {
            keyProductFeaturesItems {
                features {
                    name
                    refinementId
                    refinementUrl
                    value
                    __typename
                }
                __typename
            }
            __typename
        }
        __typename
    }
}

`;
const url = 'https://www.homedepot.com/product-information/model';

const getDetailsById = async (itemId) => {
    const variables = { itemId };
    const det = await fetch(url, {
        headers: {
            'content-type': 'application/json',
            'x-experience-name': 'major-appliances',
        },
        body: JSON.stringify({
            operationName,
            query,
            variables,
        }),
        method: 'POST',
    })
        .then((data) => data.json())
        .then((data) => {
            if (data.errors)
                throw new Error(
                    (data.errors[0] && data.errors[0].message) ||
                        'Failed to get product price'
                );
            return data;
        });

    return det;
};

const getFullDescription = async ({ canonicalUrl, description }) => {
    try {
        const dom = await JSDOM.fromURL(
            `https://www.homedepot.com${canonicalUrl}`
        );

        const fullDescription =
            [...dom.window.document.getElementsByTagName('div')].find((div) =>
                div.textContent.startsWith(description)
            )?.textContent || 'Failed to load description';

        return { fullDescription };
    } catch (error) {
        console.error(error);
        return { fullDescription: 'Failed to load description' };
    }
};

module.exports.getDetailsById = getDetailsById;
module.exports.getFullDescription = getFullDescription;
