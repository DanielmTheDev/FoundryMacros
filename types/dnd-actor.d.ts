declare global {
    namespace foundry {
        interface Actor {
            applyDamage(amount: number): Promise<void>;
            rollAbilitySave(abilityId: string, options?: object): Promise<any>;
        }
    }
}
