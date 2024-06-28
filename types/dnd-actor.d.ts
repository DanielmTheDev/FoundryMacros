declare global {
    interface Actor {
        applyDamage(amount: number): Promise<void>;
        rollAbilitySave(abilityId: string | number | string[] | undefined, options?: object): Promise<any>;
    }
}

export {};