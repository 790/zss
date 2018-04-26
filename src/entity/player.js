import {LivingEntity} from './entity';

export class Player extends LivingEntity {
    constructor(args) {
        super(args);
        this.name = args.name||'Unknown Survivor';
    }
}