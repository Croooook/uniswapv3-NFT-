import { BigInt, dataSource } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  BIG_INT_ZERO,
  UNISWAP_V3_FACTORY_ADDRESS,
  UNISWAP_V3_POSITION_MANAGER_ADDRESS,
} from "./const";
import { Position } from "../../generated/schema";
import { NonfungiblePositionManager } from "../../generated/NonfungiblePositionManager/NonfungiblePositionManager";
import { Factory as FactoryContract } from "../../generated/Factory/Factory";


export function createOrLoadPosition(tokenId: BigInt): Position | null {
  let contract = NonfungiblePositionManager.bind(
    UNISWAP_V3_POSITION_MANAGER_ADDRESS
  );
  let positionCall = contract.try_positions(tokenId);
  if (positionCall.reverted) {
    // the call reverts in situations where the position is minted
    // and deleted in the same block
    return null;
  }

  let positionResult = positionCall.value;
  let token0 = positionResult.value2;
  let token1 = positionResult.value3;

  

  let position = Position.load(tokenId.toString());
  if (position == null) {
    let factoryContract = FactoryContract.bind(UNISWAP_V3_FACTORY_ADDRESS);
    let fee = positionResult.value4;
    let poolAddress = factoryContract.getPool(token0, token1, fee);

    position = new Position(tokenId.toString());
    position.owner = ADDRESS_ZERO;
    position.pool = poolAddress.toHexString();
    position.tickLower = BigInt.fromI32(positionResult.value5);
    position.tickUpper = BigInt.fromI32(positionResult.value6);
    position.liquidity = BIG_INT_ZERO;
    
    position.save();
  } 

  return position;
}