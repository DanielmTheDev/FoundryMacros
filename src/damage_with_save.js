new Dialog({
    title: "Damage Roll",
    content: `
    <form>
      <div class="form-group">
        <label for="dc">DC:</label>
        <input type="number" id="dc" name="dc" value="15"/>
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
        <label for="halfOnSave">Half on Save:</label>
        <input type="checkbox" id="halfOnSave" name="halfOnSave" checked/>
      </div>
      <div class="form-group">
        <label for="damageRoll">Damage Roll:</label>
        <input type="text" id="damageRoll" name="damageRoll" value="2d6"/>
      </div>
    </form>
  `,
    buttons: {
        ok: {
            label: "Roll",
            callback: async (html) => {
                const dc = parseInt(html.find('[name="dc"]').val());
                const ability = html.find('[name="ability"]').val();
                const halfOnSave = html.find('[name="halfOnSave"]').is(':checked');
                const damageRoll = html.find('[name="damageRoll"]').val();

                if (!damageRoll) {
                    ui.notifications.error("Damage roll cannot be empty.");
                    return;
                }

                const targets = game.user.targets;
                if (targets.size === 0) {
                    ui.notifications.error("No targets selected.");
                    return;
                }

                for (let target of targets) {
                    let actor = target.actor;
                    if (dc) {
                        let saveRoll = await actor.rollAbilitySave(ability);
                        let saveSuccess = saveRoll.fields[1][1].formula.total >= dc;
                        if (saveSuccess)
                            return
                        let damage = new Roll(damageRoll).roll({async: false});
                        await damage.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: `Damage Roll (${saveSuccess ? "Saved" : "Failed"})`
                        });
                        let finalDamage = damage.total;
                        if (saveSuccess && halfOnSave) {
                            finalDamage = Math.floor(finalDamage / 2);
                        }
                        await actor.applyDamage(finalDamage);
                    } else {
                        let damage = new Roll(damageRoll).roll({async: false});
                        await damage.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: "Damage Roll"
                        });
                        await actor.applyDamage(damage.total);
                    }
                }
            }
        },
        cancel: {
            label: "Cancel"
        }
    }
}).render(true);
