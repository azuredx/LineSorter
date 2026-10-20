// Line Sorter Helper - Mindustry 160.x
// Straight runs: conveyor, inverted sorter, inverted sorter, repeat.
// At a bend, use a regular sorter instead.
// F8 or the HUD button toggles the helper; the mode is saved between sessions.
// No tiles are changed directly; only the local player's build plans are edited.

const Blocks = Packages.mindustry.content.Blocks;
const EventType = Packages.mindustry.game.EventType;
const KeyCode = Packages.arc.input.KeyCode;
const Log = Packages.arc.util.Log;

const settingKey = "line-sorter-helper-enabled";
let enabled = Core.settings.getBool(settingKey, true);
let preview = null;
let toggleButton = null;

function supported(block){
    return block === Blocks.conveyor || block === Blocks.titaniumConveyor;
}

function getInput(){
    return Vars.control == null ? null : Vars.control.input;
}

function clearPreview(){
    preview = null;
}

function wasQueued(plan, before){
    for(let i = 0; i < before.length; i++){
        if(plan === before[i]) return true;
    }
    return false;
}

function isTurn(previous, current, next){
    if(previous == null || next == null) return false;

    const dxIn = current.x - previous.x;
    const dyIn = current.y - previous.y;
    const dxOut = next.x - current.x;
    const dyOut = next.y - current.y;
    // Only adjacent path steps are turns. A bridge can skip cells.
    return Math.abs(dxIn) + Math.abs(dyIn) === 1 &&
        Math.abs(dxOut) + Math.abs(dyOut) === 1 &&
        (dxIn !== dxOut || dyIn !== dyOut);
}

function isSorter(block){
    return block === Blocks.sorter || block === Blocks.invertedSorter;
}

function applyLinePattern(plans, selected){
    for(let i = 0; i < plans.length; i++){
        let plan = plans[i];
        if(plan.breaking) continue;
        // Keep bridge conveyors, junctions, and other vanilla substitutions.
        if(plan.block !== selected && !isSorter(plan.block)) continue;

        let previous = i === 0 ? null : plans[i - 1];
        let next = i === plans.length - 1 ? null : plans[i + 1];
        let wanted;
        if(isTurn(previous, plan, next)){
            // A regular sorter must have a conveyor immediately before it.
            // Consecutive bends therefore alternate between sorter and conveyor.
            wanted = previous != null && previous.block === selected ? Blocks.sorter : selected;
        }else if(i + 2 < plans.length && isTurn(plan, next, plans[i + 2])){
            // Prepare the tile feeding the next turn.
            wanted = selected;
        }else{
            wanted = i % 3 === 0 ? selected : Blocks.invertedSorter;
        }

        if(isSorter(wanted) && i >= 2 && isSorter(plans[i - 1].block) && isSorter(plans[i - 2].block)){
            wanted = selected;
        }
        if(plan.block !== wanted){
            plan.block = wanted;
            plan.config = null;
        }
    }
}

function toast(message){
    if(Vars.ui != null && Vars.ui.hudfrag != null && Vars.state.isGame()){
        Vars.ui.hudfrag.showToast(message);
    }
}

function toggleEnabled(){
    enabled = !enabled;
    Core.settings.put(settingKey, enabled);
    clearPreview();
    if(toggleButton != null){
        toggleButton.setText(enabled ? "sort on" : "sort off");
        toggleButton.setChecked(enabled);
    }
    toast(enabled ? "Line Sorter: ON" : "Line Sorter: OFF");
}

function updateToggleButton(){
    if(toggleButton == null || Vars.ui == null || Vars.ui.hudfrag == null || Vars.ui.hudGroup == null || Core.scene == null) return;
    // Rhino sees Element.visible as a boolean field, not the visible(Boolp) method.
    toggleButton.visible = Vars.ui.hudfrag.shown;
    toggleButton.setPosition(Core.scene.marginLeft + 8, Vars.ui.hudGroup.getHeight() / 2 - 12);
}

// Edits the prospective line so the player can see the pattern while dragging.
// Remember the existing queue so confirmation can find every newly added plan.
function updatePreview(){
    const input = getInput();
    if(!enabled || !Vars.state.isGame() || input == null || !supported(input.block)){
        clearPreview();
        return;
    }

    const plans = input.linePlans;
    if(plans == null || plans.size === 0){
        clearPreview();
        return;
    }

    const selected = input.block;
    const unit = Vars.player == null ? null : Vars.player.unit();
    if(unit == null){
        clearPreview();
        return;
    }

    if(preview == null || preview.selected !== selected || preview.unit !== unit){
        const before = [];
        const queued = unit.plans;
        if(queued != null){
            for(let i = 0; i < queued.size; i++) before.push(queued.get(i));
        }
        preview = {selected: selected, unit: unit, before: before};
    }

    // Rhino retains the first value of a const declared inside a loop.
    const line = [];
    for(let i = 0; i < plans.size; i++){
        line.push(plans.get(i));
    }
    applyLinePattern(line, selected);
}

// Mindustry copies the line into the unit queue, then clears linePlans and fires
// this event. Assign the pattern to all new plans, including ones added after
// the last preview update.
Events.on(EventType.LineConfirmEvent, e => {
    if(!enabled || preview == null || Vars.player == null || !Vars.player.isBuilder()){
        clearPreview();
        return;
    }

    const input = getInput();
    const unit = Vars.player.unit();
    if(input == null || input.block !== preview.selected || unit !== preview.unit){
        clearPreview();
        return;
    }

    const plans = unit.plans;
    if(plans != null){
        const added = [];
        for(let i = 0; i < plans.size; i++){
            let plan = plans.get(i);
            if(!wasQueued(plan, preview.before) && !plan.breaking) added.push(plan);
        }
        applyLinePattern(added, preview.selected);
    }
    clearPreview();
});

Events.on(EventType.WorldLoadEvent, e => clearPreview());
Events.on(EventType.ResetEvent, e => clearPreview());

Events.on(EventType.ClientLoadEvent, e => {
    const TextButton = Packages.arc.scene.ui.TextButton;
    const Styles = Packages.mindustry.ui.Styles;
    toggleButton = new TextButton(enabled ? "sort on" : "sort off", Styles.togglet);
    toggleButton.setSize(78, 24);
    toggleButton.getLabel().setFontScale(0.7);
    toggleButton.getLabel().setWrap(false);
    toggleButton.setChecked(enabled);
    toggleButton.clicked(() => toggleEnabled());
    Vars.ui.hudGroup.addChild(toggleButton);
    updateToggleButton();
});

Events.run(EventType.Trigger.update, () => {
    updateToggleButton();
    if(Vars.state.isGame() && Core.input.keyTap(KeyCode.f8)){
        toggleEnabled();
    }
    updatePreview();
});

Log.info("[Line Sorter Helper] Loaded. Use the HUD button or F8 to toggle.");
