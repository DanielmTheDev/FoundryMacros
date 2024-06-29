// Retrieve conditions
const conditions = CONFIG.statusEffects.map(effect => ({
    id: effect.id,
    label: game.i18n.localize(effect.label),
    icon: effect.icon
}));

function getDialogContent() {
    return `
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
        <label for="effectType">Effect Type:</label>
        <select id="effectType" name="effectType">
          <option value="condition">Predefined Condition</option>
          <option value="custom">Custom Effect with DoT</option>
        </select>
      </div>
      <div class="form-group" id="conditionSelectGroup">
        <label for="condition">Condition:</label>
        <select id="condition" name="condition">
          ${conditions.map(condition => `<option value="${condition.id}">${condition.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="customEffectGroup" style="display: none;">
        <label for="customEffectLabel">Custom Effect Label:</label>
        <input type="text" id="customEffectLabel" name="customEffectLabel"/>
        <label for="damageOverTime">Damage Over Time:</label>
        <input type="text" id="damageOverTime" name="damageOverTime" value="1d6"/>
        <label for="dotTiming">DoT Timing:</label>
        <select id="dotTiming" name="dotTiming">
          <option value="start">Start of Turn</option>
          <option value="end">End of Turn</option>
        </select>
      </div>
      <div class="form-group">
        <label for="rerollSave">Reroll Save:</label>
        <input type="checkbox" id="rerollSave" name="rerollSave"/>
      </div>
      <div class="form-group" id="rerollTimingGroup" style="display: none;">
        <label for="rerollTiming">Reroll Timing:</label>
        <select id="rerollTiming" name="rerollTiming">
          <option value="start">Start of Turn</option>
          <option value="end">End of Turn</option>
        </select>
      </div>
    </form>
  `;
}

function getOk() {
    return {
        label: "Apply",
        callback: async (html) => {
            const dc = parseInt(html.find('[name="dc"]').val());
            const ability = html.find('[name="ability"]').val();
            const effectType = html.find('[name="effectType"]').val();
            const rerollSave = html.find('[name="rerollSave"]').is(':checked');
            const rerollTiming = html.find('[name="rerollTiming"]').val();
            const dotTiming = html.find('[name="dotTiming"]').val();
            const targets = game.user.targets;
            let effectData = {
                label: '',
                icon: '',
                origin: '',
                disabled: false,
                changes: [],
                duration: {rounds: 10, startRound: game.combat ? game.combat.round : 0}
            };

            if (effectType === 'condition') {
                const conditionId = html.find('[name="condition"]').val();
                const condition = conditions.find(cond => cond.id === conditionId);
                effectData.label = condition.label;
                effectData.icon = condition.icon;
            } else {
                effectData.label = html.find('[name="customEffectLabel"]').val();
                const damageOverTime = html.find('[name="damageOverTime"]').val();
                effectData.icon = 'icons/svg/fire.svg'; // Static icon for custom DoT effect
                effectData.changes.push({
                    key: "flags.midi-qol.OverTime",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: `turn=${dotTiming}, damageRoll=${damageOverTime}`
                });
            }

            if (rerollSave) {
                effectData.changes.push({
                    key: "flags.midi-qol.OverTime",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: `turn=${rerollTiming}, saveDC=${dc}, saveAbility=${ability}, label=${effectData.label}, saveRemove=true`
                });
            }

            if (targets.size === 0) {
                ui.notifications.error("No targets selected.");
                return;
            }

            for (let target of targets) {
                let actor = target.actor;
                if (dc && ability) {
                    let saveRoll = await actor.rollAbilitySave(ability, {chatMessage: true});
                    let saveSuccess = saveRoll.fields[1][1].formula.total >= dc;
                    if (saveSuccess) {
                        ui.notifications.info(`${actor.name} succeeded on the saving throw and is not affected.`);
                        continue;
                    }
                }

                effectData.origin = actor.uuid;
                await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

                // Apply immediate damage if it's a custom effect
                if (effectType === 'custom') {
                    const damageOverTime = html.find('[name="damageOverTime"]').val();
                    const damageRoll = new Roll(damageOverTime).roll({async: false});
                    await damageRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({actor: actor}),
                        flavor: `${effectData.label} - Immediate Damage`
                    });
                    await actor.applyDamage(damageRoll.total);
                }

                if (dc && ability) {
                    ui.notifications.info(`${actor.name} failed the saving throw and is now ${effectData.label}`);
                } else {
                    ui.notifications.info(`${actor.name} is now ${effectData.label}`);
                }
            }
        }
    };
}

function getRender() {
    return (html) => {
        const effectTypeSelect = html.find('[name="effectType"]');
        const conditionSelectGroup = html.find('#conditionSelectGroup');
        const customEffectGroup = html.find('#customEffectGroup');
        const rerollSaveCheckbox = html.find('[name="rerollSave"]');
        const rerollTimingGroup = html.find('#rerollTimingGroup');

        effectTypeSelect.change(() => {
            if (effectTypeSelect.val() === 'condition') {
                conditionSelectGroup.show();
                customEffectGroup.hide();
            } else {
                conditionSelectGroup.hide();
                customEffectGroup.show();
            }
        });

        rerollSaveCheckbox.change(() => {
            if (rerollSaveCheckbox.is(':checked')) {
                rerollTimingGroup.show();
            } else {
                rerollTimingGroup.hide();
            }
        });

        setTimeout(() => {
            html.closest('.app.window-app.dialog').css({
                width: '600px',
                height: 'auto'
            });
        }, 10);
    };
}

new Dialog({
    title: "Apply Effect",
    content: getDialogContent(),
    buttons: {
        ok: getOk(),
        cancel: {
            label: "Cancel"
        }
    },
    default: "ok",
    render: getRender()
}).render(true);
