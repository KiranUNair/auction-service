import { getEndedAuctions } from '../lib/getEndedAuctions.js';
import {closeAuction} from '../lib/closeAuction.js';
import createError from 'http-errors';

async function processAuctions(event, context){
    try {
        const auctionToClose = await getEndedAuctions();
        const closedPromises = auctionToClose.map(auction => closeAuction(auction));
        await Promise.all(closedPromises);
    
        return { closed: closedPromises.length };
        
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
}

export const handler = processAuctions;