/*    SHOOTING TARGET
    contains all functional components of shooting target objects, including file location
    model's location path, interface for creation calls, on-object component, and management
    module (used for creating, enabling, disabling, and destroying splat objects). 
*/

import { Schemas, engine, Entity, Transform, GltfContainer, ColliderLayer } from "@dcl/sdk/ecs";

export module TargetObject {
	//when true debug logs are generated (toggle off when you deploy)
	const isDebugging:boolean = false;

	/** shooting model location */
	const MODEL_TARGET_OBJECT = "models/shooting-range/shooting-target.glb";

	/** represents all possible target types */  
	export enum TARGET_TYPE {
		STATIC = 0,
		MOVING = 1,
	}

	/** pool of existing objects, managing 2 types of targets: static & moving */
	var pooledObjects:Entity[][] = [[],[]];

	/** object interface used to define all data required to create a new target object */
	export interface TargetDataObject {
		type: TARGET_TYPE;
		pos: { x:number; y:number; z:number; };
	}

	/** component data def for static targets, this will exist attached on the object's entity as a component */
	export const TargetStaticComponentData = { 
		/** true when this object is rendered in the scene */
		isActive:Schemas.Boolean,
	}
	/** define component, adding it to the engine as a managed behaviour */
	export const TargetStaticComponent = engine.defineComponent("TargetStaticComponentData", TargetStaticComponentData);

	/** component data def for moving targets, this will exist attached on the object's entity as a component */
	export const TargetMovingComponentData = { 
		/** true when this object is rendered in the scene */
		isActive:Schemas.Boolean,
		/** if true object's function is being processed by system */
		isProcessing:Schemas.Boolean,
		/** movement speed of target*/
		speed:Schemas.Number,
		/** currently targeted waypoint */
		indexCur:Schemas.Number,
		/** waypoints for target to move to */
		waypoints:Schemas.Array(Schemas.Vector3),
		/** normalized movement speed */
		normal:Schemas.Vector3,
	}
	/** define component, adding it to the engine as a managed behaviour */
	export const TargetMovingComponent = engine.defineComponent("TargetMovingComponentData", TargetMovingComponentData);
	/** timed processing for all moving target components */
	const targetProcessingMoving = function MovingTimer(dt: number) {
		//process every entity that has this component
		for (const [entity] of engine.getEntitiesWith(TargetMovingComponent)) {
			const component = TargetMovingComponent.getMutable(entity);
			//ensure target is active and processing movement
			if(!component.isActive || !component.isProcessing) continue;
			//get transform
			const pos = Transform.getMutable(entity).position;
			//check for destination
			if (
				Math.abs(pos.x - component.waypoints[component.indexCur].x) < 0.05 &&
				Math.abs(pos.y - component.waypoints[component.indexCur].y) < 0.05 &&
				Math.abs(pos.z - component.waypoints[component.indexCur].z) < 0.02
			) {
				//update target
				component.indexCur++;
				if(component.indexCur >= component.waypoints.length) component.indexCur = 0;
				//determine new direction that object has to move in
				const direction = {
					x: component.waypoints[component.indexCur].x - pos.x,
					y: component.waypoints[component.indexCur].y - pos.y,
					z: component.waypoints[component.indexCur].z - pos.z
				};
				//recalculate norm translation
				const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
				component.normal = {
				x: direction.x / length,
				y: direction.y / length,
				z: direction.z / length
				};
			}
			//move towards target location
			pos.x += (dt*component.speed*component.normal.x);
			pos.y += (dt*component.speed*component.normal.y);
			pos.z += (dt*component.speed*component.normal.z);
		}
	}
	/** add system to engine */
	engine.addSystem(targetProcessingMoving);

	/** creates a new target object, returning reference to its entity (this handles the creation of the entity as well so ns can handle pooling) */
	export function Create(targetData:TargetDataObject):Entity {
		if(isDebugging) console.log("Target Object: attempting to create object of type="+targetData.type+" at pos(x="+targetData.pos.x+", y="+targetData.pos.y+", z="+targetData.pos.z+")...");

		//attempt to find pre-existing component
		var reused:undefined|Entity = undefined; 
		for (let i = 0; i < pooledObjects[targetData.type].length; i++) {
			//process based on component type we are after 
			switch(targetData.type) {
				case TARGET_TYPE.STATIC:
					if(!TargetStaticComponent.get(pooledObjects[targetData.type][i]).isActive) reused = Enable(pooledObjects[targetData.type][i], targetData);
				break;
				case TARGET_TYPE.MOVING:
					if(!TargetMovingComponent.get(pooledObjects[targetData.type][i]).isActive) reused = Enable(pooledObjects[targetData.type][i], targetData);
				break;
			}
			if(reused != undefined) {
				if(isDebugging) console.log("Target Object: recycled unused object!");
				return reused;
			}
		}

		//create object
		//  create entity
		const entity = engine.addEntity();
		Transform.create(entity, {
			position: {x:targetData.pos.x, y:targetData.pos.y, z:targetData.pos.z}
		});
		
		//  add custom model
		GltfContainer.create(entity, {
			src: MODEL_TARGET_OBJECT,
			visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
			invisibleMeshesCollisionMask: undefined
		});
		//  add requested component type, initialized by type
		switch(targetData.type)
		{
			case TARGET_TYPE.STATIC:
				TargetStaticComponent.create(entity,{ isActive: true });
			break;
			case TARGET_TYPE.MOVING:
				TargetMovingComponent.create(entity,{ isActive: true, isProcessing: false });
			break;
		}

		//add entity to pooling
		pooledObjects[targetData.type].push(entity);
		if(isDebugging) console.log("Target Object: created new object!");
		//provide entity reference
		return entity;
  	}

	/** enables the given object with the provided settings (assumes object was previously disabled) */
	export function Enable(entity:Entity, targetData:TargetDataObject):Entity {
		if(isDebugging) console.log("Target Object: re-enabling unused object...");
		
		//reactivate requested component, initialized by type
		switch(targetData.type)
		{
			case TARGET_TYPE.STATIC:
				TargetStaticComponent.getMutable(entity).isActive = true;
			break;
			case TARGET_TYPE.MOVING:
				TargetMovingComponent.getMutable(entity).isActive = true;
			break;
		}
		
		//place objects
		Transform.getMutable(entity).position = { x:targetData.pos.x, y:targetData.pos.y, z:targetData.pos.z }; 

		//enable object (soft-state work-around)
		Transform.getMutable(entity).scale = { x:1, y:1, z:1 }; 
		
		if(isDebugging) console.log("Target Object: re-enabled unused object!");
		return entity;
	}

    /** disables all objects from the game */
    export function DisableAll() {
        if(isDebugging) console.log("Target Object: disabling all objects...");

        //parse all objects in the pool
        for (let i = 0; i < pooledObjects.length; i++) {
			for (let j = 0; j < pooledObjects[i].length; j++) {
				Disable(pooledObjects[i][j], i);
			}
        }

        if(isDebugging) console.log("Target Object: disabled all objects!");
    }
    /** disables given object from game (does not destroy object, remains in pool) */
    export function Disable(entity:Entity, type:number) {
        //disable via component, based on object type
		switch(type)
		{
			case TARGET_TYPE.STATIC:
				TargetStaticComponent.getMutable(entity).isActive = false;
			break;
			case TARGET_TYPE.MOVING:
				TargetMovingComponent.getMutable(entity).isActive = false;
				TargetMovingComponent.getMutable(entity).isProcessing = false;
			break;
		}

        //hide object (soft-state work-around)
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** destroyes all objects in the game */
    export function DestroyAll() {
        if(isDebugging) console.log("Target Object: destroying all objects...");

        //parse all objects in the pool
        for (let i = 0; i < pooledObjects.length; i++) {
			while(0 < pooledObjects[i].length) {
				const obj = pooledObjects[i].pop();
				if(obj != undefined) Destroy(obj);
			}
		}

        if(isDebugging) console.log("Target Object: destroyed all objects!");
    }
    /** destroys given object (removes from engine and pool) */
    export function Destroy(entity:Entity) {
        engine.removeEntity(entity);
    }
}