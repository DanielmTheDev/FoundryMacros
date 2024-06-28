// Retrieve conditions
const conditions = CONFIG.statusEffects.map(effect => ({
    id: effect.id,
    label: game.i18n.localize(effect.label),
    icon: effect.icon
}));

new Dialog({
    title: "Apply Condition",
    content: `
    <form>
      <div class="form-group">
        <label for="dc">DC:</label>
        <input type="number" id="dc" name="dc" value="15"/>|
      </div>
      <div class="form-group">
        <label for="ability">Ability Score:</label>
        <select id="ability" name="ability">
          <option value="str">Strength</option>
          <option value="dex" selected>Dexterity</option>
          <option value="con">Constitution</option>
          <option value="int">Intelligence</option>
          <option value="wis">Wisdom</option>
          <option value="cha">Charisma</option>
        </select>
      </div>
      <div class="form-group">
        <label for="condition">Condition:</label>
        <select id="condition" name="condition">
          ${conditions.map(condition => `<option value="${condition.id}">${condition.label}</option>`).join('')}
        </select>
      </div>
    </form>
  `,
    buttons: {
        ok: {
            label: "Apply",
            callback: async (html) => {
                const dc = parseInt(html.find('[name="dc"]').val());
                const ability = html.find('[name="ability"]').val();
                const conditionId = html.find('[name="condition"]').val();
                const condition = conditions.find(cond => cond.id === conditionId);

                const targets = game.user.targets;
                if (targets.size === 0) {
                    ui.notifications.error("No targets selected.");
                    return;
                }

                for (let target of targets) {
                    let actor = target.actor;
                    if (dc && ability) {
                        let saveRoll = await actor.rollAbilitySave(ability, { chatMessage: true });
                        let saveSuccess = saveRoll.fields[1][1].formula.total >= dc;
                        if(saveSuccess){
                            ui.notifications.info(`${actor.name} succeeded on the saving throw and is not affected.`);
                            return
                        }
                        await actor.createEmbeddedDocuments("ActiveEffect", [{
                            label: condition.label,
                            icon: condition.icon,
                            origin: actor.uuid,
                            disabled: false,
                            changes: [],
                            duration: { rounds: 10, startRound: game.combat ? game.combat.round : 0 }
                        }]);
                        ui.notifications.info(`${actor.name} failed the saving throw and is now ${condition.label}`);

                    } else {
                        await actor.createEmbeddedDocuments("ActiveEffect", [{
                            label: condition.label,
                            icon: condition.icon,
                            origin: actor.uuid,
                            disabled: false,
                            changes: [],
                            duration: { rounds: 10, startRound: game.combat ? game.combat.round : 0 }
                        }]);
                        ui.notifications.info(`${actor.name} is now ${condition.label}`);
                    }
                }
            }
        },
        cancel: {
            label: "Cancel"
        }
    }
}).render(true);
