export type Validator = (value: any) => boolean | Promise<boolean>;

export type ValidatorRule = {
    type: "min",
    value: number;
} | {
    type: "max",
    value: number;
} | {
    type: "required"
} | {
    type: "minLength",
    value: string
} | {
    type: "maxLength",
    value: string
} | {
    type: "pattern",
    value: RegExp
} | {
    type: "custom",
    value: Validator
}

export class RuleBuilder {
    private rules: ValidatorRule[] = [];

    min(value: number) {
        this.rules.push({ type: "min", value });
        return this;
    }

    max(value: number) {
        this.rules.push({ type: "max", value });
        return this;
    }

    required() {
        this.rules.push({ type: "required" });
        return this;
    }

    minLength(value: string) {
        this.rules.push({ type: "minLength", value });
        return this;
    }

    maxLength(value: string) {
        this.rules.push({ type: "maxLength", value });
        return this;
    }

    pattern(value: RegExp) {
        this.rules.push({ type: "pattern", value });
        return this;
    }

    custom(value: Validator) {
        this.rules.push({ type: "custom", value });
        return this;
    }

    build(): ValidatorRule[] {
        return this.rules;
    }
}

export function rule() {
    return new RuleBuilder();
}