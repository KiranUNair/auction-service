import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import validator from '@middy/validator';
import cors from '@middy/http-cors';
import { getAuctionById } from './getAuction.js';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3.js';
import { updateAuctionUrl } from '../lib/updateAuctionUrl.js';
import auctionPictureSchema from '../lib/schemas/auctionPictureSchema.js';


async function uploadAuctionPicture(event, context){
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionById(id);
    
    //Validate auction ownership
    if(email !== auction.seller)
        throw new createError.Forbidden('You are not the seller of this auction!');

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');// This buffer will be used to upload object to S3
    let updatedAuction;
    
    try {
        const pictureUrl = await uploadPictureToS3(auction.id + 'jpg', buffer);
        updatedAuction = await updateAuctionUrl(auction, pictureUrl);        
        
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction)
    };
}

export const handler = middy(uploadAuctionPicture)
.use(httpErrorHandler())
.use(cors())
.use(validator({
    inputSchema: auctionPictureSchema,
    ajvOptions:{
        strict: false
    }
}));