const fetch = require('node-fetch');

const query = `query reviews($itemId: String!, $startIndex: Int) {
    reviews(itemId: $itemId, startIndex: $startIndex) {
        Results {
            IsRecommended
            ProductId
            SubmissionTime
            Title
            Rating
            RatingRange
            ReviewText
            UserNickname
            __typename
        }

        TotalResults
        __typename
    }
}
`;

const url =
    'https://www.homedepot.com/product-information/model?opname=reviews';

const operationName = 'reviews';

const getReviews = async (itemId, limit = 1000) => {
    let total = null;
    let count = 0;
    const reviews = [];
    while (total === null || count < total) {
        const variables = {
            itemId,
            startIndex: count,
        };
        const newReviews = await fetch(url, {
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
                const { Results, TotalResults } = data.data.reviews;
                total = Math.min(limit, TotalResults);
                count += Results.length;
                return Results;
            })
            .catch((err) => {
                return { error: err?.message || err };
            })
            .finally(() => {
                if (total === null) total = 0;
            });
        reviews.push(...newReviews);
    }

    return reviews;
};

module.exports.default = getReviews;
