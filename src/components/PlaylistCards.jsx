import React from "react";
import PlaylistCard from "./PlaylistCard.jsx";

export default class PlaylistCards extends React.Component {
    render() {
        const { currentList,
                keyNamePairs,
                deleteListCallback, 
                loadListCallback,
                renameListCallback,
                duplicateListCallback,
                changeEditState} = this.props;
        return (
            <div id="playlist-cards">
                {
                    keyNamePairs.map((pair) => (
                        <PlaylistCard
                            key={pair.key}
                            keyNamePair={pair}
                            selected={(currentList !== null) && (currentList.key === pair.key)}
                            deleteListCallback={deleteListCallback}
                            loadListCallback={loadListCallback}
                            renameListCallback={renameListCallback}
                            duplicateListCallback={duplicateListCallback}
                            changeEditState={changeEditState}
                        />
                    ))
                }
            </div>
        );
    }
}