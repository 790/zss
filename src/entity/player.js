import {LivingEntity} from './entity';

export class Player extends LivingEntity {
    constructor(args) {
        super(args);
        if(args.instance == null) {
            args.instance = 0;
        }
        this.instance = args.instance;
        this.name = args.name||'Unknown Survivor';
    }
}