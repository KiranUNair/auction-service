import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware.js';
import createError from 'http-errors';
import { getAuctionById } from './getAuction.js';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema.js';

const dynamodb =  new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    
    const { id } = event.pathParameters; //return query parameters from the event object
    const { amount } = event.body;
    const { email } = event.requestContext.authorizer;

    const auction = await getAuctionById(id);

    //Bid Identity validation
    if(email === auction.seller)
        throw new createError.Forbidden(`You cannot bid for your own auctions!`);

    //Double bid validation
    if(email === auction.highestBid.bidder)
        throw new createError.Forbidden(`You cannot bid for the same product again!`);

    // Auction status validation
    if(auction.status === 'CLOSED')
        throw new createError.Forbidden(`You cannot bid on closed auctions!`);

    //Bid amount validation
    if (amount <= auction.highestBid.amount)
        throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`);    

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email
        },
        ReturnValues: 'ALL_NEW'
    };
    
    let updatedAuction;

    try {
        const result = await dynamodb.update(params).promise();
        updatedAuction = result.Attributes;
        
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction)
    };
}

export const handler = commonMiddleware(placeBid)
    .use(validator({
        inputSchema: placeBidSchema,
        ajvOptions:{
           strict: false 
        }
    }));