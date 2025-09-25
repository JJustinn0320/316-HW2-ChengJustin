import { jsTPS_Transaction } from "jstps";

export default class AddSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, initIndex, initSong){
        super();
        this.app = initApp;
        this.index = initIndex;
        this.song = initSong
    }

    executeDo(){
        this.app.handleAddSong(this.index, this.song);
    }

    executeUndo(){
        this.app.handleDeleteSong(this.index);
    }
}