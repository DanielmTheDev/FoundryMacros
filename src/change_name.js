if (!token) {
    ui.notifications.warn("Please select a token.");
} else {
    let actor = token.actor;

    // Prompt for the new name
    let newName = await new Promise((resolve) => {
        new Dialog({
            title: "Rename Actor, Prototype Token, and Placed Tokens",
            content: `<p>Enter the new name:</p>
                <input type="text" id="new-name" value="${actor.name}"/>`,
            buttons: {
                ok: {
                    label: "OK",
                    callback: (html) => resolve(html.find("#new-name").val()),
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(null),
                },
            },
            default: "ok",
        }).render(true);
    });

    if (newName !== null && newName.trim() !== "") {
        // Update the Actor name
        await actor.update({ name: newName });

        // Update the Prototype Token name
        await actor.prototypeToken.update({ name: newName });

        // Update all placed tokens across all scenes
        for (let scene of game.scenes) {
            let tokensToUpdate = scene.tokens.filter(t => t.actorId === actor.id);
            for (let tokenDocument of tokensToUpdate) {
                await tokenDocument.update({ name: newName });
            }
        }

        ui.notifications.info(`Updated Actor, Prototype Token, and all Placed Tokens to "${newName}".`);
    }
}
