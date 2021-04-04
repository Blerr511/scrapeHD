const fetch = require('node-fetch');

const query = `
    query searchModel($pageSize: Int, $keyword: String) {
    searchModel(keyword: $keyword) {
        products(pageSize: $pageSize) {
            itemId
            availabilityType {
                discontinued
                type
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
            identifiers {
                canonicalUrl
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
            __typename
        }
        id
        __typename
    }
}
`;

const operationName = 'searchModel';
const url = 'https://www.homedepot.com/product-information/model';
const getPrice = (itemId) => {
    const variables = { keyword: itemId, pageSize: 2 };
    return fetch(url, {
        headers: {
            'content-type': 'application/json',
            'x-experience-name': 'major-appliances',
        },
        body: JSON.stringify({ operationName, query, variables }),
        method: 'POST',
    })
        .then((res) => {
            if (res.status === 403) return Promise.reject('Access Denied');
            return res.json();
        })
        .then((data) => {
            if (data.errors)
                throw new Error(
                    (data.errors[0] && data.errors[0].message) ||
                        'Failed to get product price'
                );
            return data;
        });
};

module.exports.getPrice = getPrice;
