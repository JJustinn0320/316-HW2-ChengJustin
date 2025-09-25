import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import { jsTPS } from 'jstps';

// OUR TRANSACTIONS
import AddSong_Transaction from './transactions/AddSong_Transaction.js';
import DeleteSong_Transaction from './transactions/DeleteSong_Transaction.js';
import DuplicateSong_Transaction from './transactions/DuplicateSong_Transaction.js';
import EditSong_Transaction from './transactions/EditSong_Transaction.js';
import MoveSong_Transaction from './transactions/MoveSong_Transaction.js';

// THESE REACT COMPONENTS ARE MODALS
import DeleteListModal from './components/DeleteListModal.jsx';
import EditSongModal from './components/EditSongModal.jsx';

// THESE REACT COMPONENTS ARE IN OUR UI
import Banner from './components/Banner.jsx';
import EditToolbar from './components/EditToolbar.jsx';
import SidebarHeading from './components/SidebarHeading.jsx';
import SidebarList from './components/PlaylistCards.jsx';
import SongCards from './components/SongCards.jsx';
import Statusbar from './components/Statusbar.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS IS OUR TRANSACTION PROCESSING SYSTEM
        this.tps = new jsTPS();

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            listKeyPairMarkedForDeletion : null,
            currentList : null,
            sessionData : loadedSessionData,
            currentSongIndex: null,      
            currentSong: null 
        }
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            songs: []
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF DELETING A LIST.
    deleteList = (key) => {
        // IF IT IS THE CURRENT LIST, CHANGE THAT
        let newCurrentList = null;
        if (this.state.currentList) {
            if (this.state.currentList.key !== key) {
                // THIS JUST MEANS IT'S NOT THE CURRENT LIST BEING
                // DELETED SO WE'LL KEEP THE CURRENT LIST AS IT IS
                newCurrentList = this.state.currentList;
            }
        }

        let keyIndex = this.state.sessionData.keyNamePairs.findIndex((keyNamePair) => {
            return (keyNamePair.key === key);
        });
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        if (keyIndex >= 0)
            newKeyNamePairs.splice(keyIndex, 1);

        // AND FROM OUR APP STATE
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            currentList: newCurrentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter - 1,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // DELETING THE LIST FROM PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationDeleteList(key);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    deleteMarkedList = () => {
        this.deleteList(this.state.listKeyPairMarkedForDeletion.key);
        this.hideDeleteListModal();
    }
    // THIS FUNCTION SPECIFICALLY DELETES THE CURRENT LIST
    deleteCurrentList = () => {
        if (this.state.currentList) {
            this.deleteList(this.state.currentList.key);
        }
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : null,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newCurrentList,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: null,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
        });
    }
    setStateWithUpdatedList(list) {
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : list,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
    }
    getPlaylistSize = () => {
        return this.state.currentList.songs.length;
    }
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    moveSong(start, end) {
        let list = this.state.currentList;

        // WE NEED TO UPDATE THE STATE FOR THE APP
        start -= 1;
        end -= 1;
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }
        this.setStateWithUpdatedList(list);
    }
    // THIS FUNCTION ADDS A MoveSong_Transaction TO THE TRANSACTION STACK
    addMoveSongTransaction = (start, end) => {
        let transaction = new MoveSong_Transaction(this, start, end);
        this.tps.processTransaction(transaction);
    }
    addAddSongTransaction = () => {
        let index = this.state.currentList.songs.length;
        let transaction = new AddSong_Transaction(this, index, null);
        this.tps.processTransaction(transaction);
    }
    addDeleteSongTransaction = (songIndex) => {
        const songToDuplicate = this.state.currentList.songs[songIndex];
        const duplicatedSong = JSON.parse(JSON.stringify(songToDuplicate));

        let transaction = new DeleteSong_Transaction(this, songIndex, duplicatedSong);
        this.tps.processTransaction(transaction);
    }
    addDuplicateSongTransaction = (songIndex) => {
        const songToDuplicate = this.state.currentList.songs[songIndex];
        const duplicatedSong = JSON.parse(JSON.stringify(songToDuplicate));
        duplicatedSong.title = duplicatedSong.title + "(Copy)";

        let transaction = new DuplicateSong_Transaction(this, songIndex, duplicatedSong);
        this.tps.processTransaction(transaction);
    }
    addEditSongTransaction = (songIndex, newSong) => {
        const songToDuplicate = this.state.currentList.songs[songIndex];
        const oldSong = JSON.parse(JSON.stringify(songToDuplicate));

        let transaction = new EditSong_Transaction(this, songIndex, oldSong, newSong);
        this.tps.processTransaction(transaction);
    }
    // event listeners
    componentDidMount() {
        // Add keyboard event listener when component mounts
        document.addEventListener('keydown', this.handleKeyDown);
    }
    componentWillUnmount() {
        // Remove keyboard event listener when component unmounts
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (event) => {
        // Check if Ctrl key is pressed
        if (event.ctrlKey || event.metaKey) { // metaKey for Mac Command key
            switch (event.key) {
                case 'z':
                    // Ctrl+Z - Undo
                    if (!event.shiftKey) { // not Ctrl+Shift+Z
                        event.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    // Ctrl+Y - Redo
                    event.preventDefault();
                    this.redo();
                    break;
                case 'Z':
                    // Ctrl+Shift+Z - Redo (alternative)
                    if (event.shiftKey) {
                        event.preventDefault();
                        this.redo();
                    }
                    break;
            }
        }
    }

    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING AN UNDO
    undo = () => {
        console.log("undoo");
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING A REDO
    redo = () => {
        console.log("redoo");
        if (this.tps.hasTransactionToDo()) {
            this.tps.doTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    markListForDeletion = (keyPair) => {
        this.setState(prevState => ({
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : keyPair,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteListModal();
        });
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.add("is-visible");
    }
    showEditSongModal() {
        console.log("hi");
        let modal = document.getElementById("edit-song-modal");
        modal.classList.add("is-visible");
    }

    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.remove("is-visible");
    }
    hideEditSongModal() {
        let modal = document.getElementById("edit-song-modal");
        modal.classList.remove("is-visible");
    }

    handleEditSong = (songIndex, updatedSong) => {
        if (!this.state.currentList) return;
        
        // Update the song in the current list
        const updatedSongs = [...this.state.currentList.songs];
        updatedSongs[songIndex] = updatedSong;
        
        const updatedList = {
            ...this.state.currentList,
            songs: updatedSongs
        };
        
        this.setStateWithUpdatedList(updatedList);
        this.hideEditSongModal(); // Close the modal after saving
    }
    handleEditSongClick = (songIndex) => {
        console.log("editing mdoal");
        if (!this.state.currentList || !this.state.currentList.songs[songIndex]) 
            return;
        
        // Set the song we're editing and show the modal
        this.setState({
            currentSongIndex: songIndex,
            currentSong: this.state.currentList.songs[songIndex]
        }, () => {
            // Show the modal after state is updated
            console.log("show mdoal");
            this.showEditSongModal();
        });
    }
    handleDeleteSong = (songIndex) => {
        if (!this.state.currentList) 
            return;
        
        // Remove the song from the current list
        const updatedSongs = [...this.state.currentList.songs];
        updatedSongs.splice(songIndex, 1); // Remove 1 item at songIndex
        
        const updatedList = {
            ...this.state.currentList,
            songs: updatedSongs
        };
        
        this.setStateWithUpdatedList(updatedList);
    }
    handleDuplicateSong = (songIndex) => {
        if (!this.state.currentList) 
            return;
        
        // Create a deep copy of the song
        const songToDuplicate = this.state.currentList.songs[songIndex];
        const duplicatedSong = JSON.parse(JSON.stringify(songToDuplicate));
        
        // Optionally modify the title to indicate it's a duplicate
        duplicatedSong.title = duplicatedSong.title + " (Copy)";
        
        // Insert the duplicate right after the original song
        const updatedSongs = [...this.state.currentList.songs];
        updatedSongs.splice(songIndex + 1, 0, duplicatedSong);
        
        const updatedList = {
            ...this.state.currentList,
            songs: updatedSongs
        };
        
        this.setStateWithUpdatedList(updatedList);
    }
    handleDuplicatePlayList = (key) => {
        const listToDuplicate = this.db.queryGetList(key);
        if (!listToDuplicate) return;
        
        //deep copy of the playlist
        const duplicatedList = JSON.parse(JSON.stringify(listToDuplicate));
        
        // new key and name 
        const newKey = this.state.sessionData.nextKey;
        const newName = duplicatedList.name + " (Copy)";
        
        // update the duplicate's 
        duplicatedList.key = newKey;
        duplicatedList.name = newName;
        
        // Create keyNamePair 
        const newKeyNamePair = { "key": newKey, "name": newName };
        const updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);
        
        this.setState(prevState => ({
            listKeyPairMarkedForDeletion: prevState.listKeyPairMarkedForDeletion,
            currentList: duplicatedList, 
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // Save to storage
            this.db.mutationCreateList(duplicatedList);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    handleAddSong = (songIndex, song) =>{
        const newSong = {
            title: song ? song.title : "Untitled",
            artist: song ? song.artist : "???",
            year: song ? song.year : "2000",
            youTubeId: song ? song.youTubeId : "dQw4w9WgXcQ"
        }

        const updatedSongs = [...this.state.currentList.songs];
        updatedSongs.splice(songIndex, 0, newSong);

        const updatedList = {
            ...this.state.currentList,
            songs: updatedSongs
        };
    
        this.setStateWithUpdatedList(updatedList);
    }

    render() {
        let canAddSong = this.state.currentList !== null;
        let canUndo = this.tps.hasTransactionToUndo();
        let canRedo = this.tps.hasTransactionToDo();
        let canClose = this.state.currentList !== null;
        return (
            <>
                <Banner />
                <SidebarHeading
                    createNewListCallback={this.createNewList}
                />
                <SidebarList
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    deleteListCallback={this.markListForDeletion}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                    duplicateListCallback={this.handleDuplicatePlayList}
                />
                <EditToolbar
                    canAddSong={canAddSong}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canClose={canClose} 
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    closeCallback={this.closeCurrentList}
                    addSongCallback={this.addAddSongTransaction}
                />
                <SongCards
                    currentList={this.state.currentList}
                    moveSongCallback={this.addMoveSongTransaction}
                    hideEditSongModalCallback={this.hideEditSongModal}
                    onEditSong={this.handleEditSongClick}
                    onDeleteSong={this.addDeleteSongTransaction}
                    onDuplicateSong={this.addDuplicateSongTransaction}/>
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteListModal
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    deleteListCallback={this.deleteMarkedList}
                />
                <EditSongModal
                    song={this.state.currentSong}
                    confirmEditSong={(updatedSong) => 
                        this.addEditSongTransaction(this.state.currentSongIndex, updatedSong)
                    }
                    hideEditSongModal={this.hideEditSongModal}
                />
            </>
        );
    }
}

export default App;
