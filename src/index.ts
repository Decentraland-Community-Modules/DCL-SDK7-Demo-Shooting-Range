/**   SHOOTING TARGET DEMO
    this file outlines the standard use of the shooting target module & all included
    components. the target shooting module allows you to create targets around your scene
   	(both static and moving) that can be shot by the player. players can only shoot targets
   	when they are within the bounds of the firing range area. you can find a detailed
  	description of each component within its file.
 */

import { PlayerShootingArea } from "./shooting-range/player-shooting-area";
import { TargetObject } from "./shooting-range/target-object";

export function main() {
	//NOTE: all that is required for you to set up shooting targets in your scene is:
	//	1 - set a shooting area
	// 	2 - create targets
	//all score & shot decal objects are handled internally

	//create firing range trigger (player will be allowed to shoot when in this area)
	PlayerShootingArea.Move({x:16,y:0,z:4});

	//create targets (will display scores when hit by player)
	//	static target 1
	const targetStatic1 = TargetObject.Create({
		type: TargetObject.TARGET_TYPE.STATIC,
		pos: {x:13.5, y:1, z:18}
	});
	//	static target 2
	const targetStatic2 = TargetObject.Create({
		type: TargetObject.TARGET_TYPE.STATIC,
		pos: {x:18.5, y:1, z:22}
	});
	//	static target 3
	const targetStatic3 = TargetObject.Create({
		type: TargetObject.TARGET_TYPE.STATIC,
		pos: {x:16, y:1, z:26}
	});
	//	moving target 1
	const targetMoving1 = TargetObject.Create({
		type: TargetObject.TARGET_TYPE.MOVING,
		pos: {x:11, y:1, z:20}
	});
	//set custom move speed
	TargetObject.TargetMovingComponent.getMutable(targetMoving1).speed = 1.2;
	//set custom waypoints
	TargetObject.TargetMovingComponent.getMutable(targetMoving1).waypoints = [{x:11,y:1,z:16},{x:21,y:1,z:16}];
	//start processing (begins target movement)
	TargetObject.TargetMovingComponent.getMutable(targetMoving1).isProcessing = true;
	//	moving target 2
	const targetMoving2 = TargetObject.Create({
		type: TargetObject.TARGET_TYPE.MOVING,
		pos: {x:21, y:1, z:24}
	});
	//set custom move speed
	TargetObject.TargetMovingComponent.getMutable(targetMoving2).speed = 2.4;
	//set custom waypoints
	TargetObject.TargetMovingComponent.getMutable(targetMoving2).waypoints = [{x:21,y:1,z:20},{x:11,y:1,z:20}];
	//start processing (begins target movement)
	TargetObject.TargetMovingComponent.getMutable(targetMoving2).isProcessing = true;
}