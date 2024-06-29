// Macro for grappling or knocking prone in Foundry VTT

// Prompt the user for either prone or grapple
let condition = await new Promise((resolve) => {
    new Dialog({
        title: "Choose Condition",
        content: "<p>Do you want to apply Prone or Grapple?</p>",
        buttons: {
            prone: {
                label: "Prone",
                callback: () => resolve("prone"),
            },
            grapple: {
                label: "Grapple",
                callback: () => resolve("grapple"),
            },
        },
        default: "prone",
    }).render(true);
});

// Ensure a token is selected
if (canvas.tokens.controlled.length !== 1) {
    return ui.notifications.warn("You must select a single token.");
}

// Get the selected token and its actor
let attacker = canvas.tokens.controlled[0];
let attackerActor = attacker.actor;

// Ensure a target is selected
if (game.user.targets.size !== 1) {
    return ui.notifications.warn("You must target a single token.");
}

// Get the target token and its actor
let target = Array.from(game.user.targets)[0];
let targetActor = target.actor;

// Roll Athletics for the attacker
let attackerRoll = await attackerActor.rollSkill("ath");
attackerRollTotal = attackerRoll.fields[1][1].formula.total

// Determine the higher of target's Athletics or Acrobatics
let targetAthletics = targetActor.data.data.skills.ath.total;
let targetAcrobatics = targetActor.data.data.skills.acr.total;
let targetSkill = targetAthletics >= targetAcrobatics ? "ath" : "acr";

// Roll the chosen skill for the target
let targetRoll = await targetActor.rollSkill(targetSkill);
let targetRollTotal = targetRoll.fields[1][1].formula.total


// Compare the rolls and apply the condition if the attacker wins
if (attackerRollTotal > targetRollTotal) {
    let effectData = {
        label: condition.charAt(0).toUpperCase() + condition.slice(1),
        icon: condition === "prone" ? "icons/svg/falling.svg" : "icons/svg/net.svg",
        changes: [],
        origin: attackerActor.uuid,
        disabled: false,
        flags: {
            core: {
                statusId: condition
            }
        }
    };

    await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    ui.notifications.info(`${attacker.name} successfully applied ${condition} to ${target.name}!`);
} else {
    ui.notifications.info(`${attacker.name} failed to apply ${condition} to ${target.name}.`);
}