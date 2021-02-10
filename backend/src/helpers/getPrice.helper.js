const fetch = require('node-fetch');

const getPrice = (itemId) =>
    fetch('https://www.homedepot.com/product-information/model', {
        headers: {
            'content-type': 'application/json',
            'x-experience-name': 'major-appliances',
        },
        body: `{\"operationName\":\"productClientOnlyProduct\",\"variables\":{\"itemId\":\"${itemId}\",\"storeId\":\"1861\"},\"query\":\"query productClientOnlyProduct($storeId: String, $itemId: String!, $dataSource: String, $loyaltyMembershipInput: LoyaltyMembershipInput) {\\n  product(itemId: $itemId, dataSource: $dataSource, loyaltyMembershipInput: $loyaltyMembershipInput) {pricing(storeId: $storeId) {  value\\n  }\\n  __typename\\n  }\\n}\\n\"}`,
        method: 'POST',
    })
        .then((data) => data.json())
        .then((data) => {
            if (data.errors)
                throw new Error(
                    (data.errors[0] && data.errors[0].message) ||
                        'Failed to get product price'
                );
            return data?.data?.product?.pricing?.value;
        });

module.exports.getPrice = getPrice;
