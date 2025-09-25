import { jsTPS_Transaction } from "jstps";

export default class DuplicateSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, initIndex, initSong){
        super();
        this.app = initApp;
        this.index = initIndex + 1;
        this.song = initSong;
    }

    executeDo(){
        this.app.handleAddSong(this.index, this.song);
    }

    executeUndo(){
        this.app.handleDeleteSong(this.index);
    }
}