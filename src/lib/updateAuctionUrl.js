import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function updateAuctionUrl(auction, url){
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: {id: auction.id},
        UpdateExpression: 'set auctionUrl = :auctionUrl',
        ExpressionAttributeValues:{
            ':auctionUrl': url
        },
        ReturnValues: 'ALL_NEW'
    }

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
};