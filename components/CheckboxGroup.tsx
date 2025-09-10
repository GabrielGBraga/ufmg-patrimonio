import React from 'react';
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import Checkbox from "expo-checkbox";
import { ThemedCheckbox } from "@/components/ui/ThemedCheckbox";

// Handles the checkboxes from
export function CheckboxGroup ({ selectedCheckbox, onCheckboxChange }) {

    const options = [
        { label: "Bom", value: "Bom" },
        { label: "Ocioso", value: "Ocioso" },
        { label: "Irrecuperável", value: "Irrecuperável" },
    ];

    return (
        <ThemedView style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
            {options.map((option) => (
                <ThemedView key={option.value} style={{ flexDirection: "row", alignItems: "center" }}>
                    <ThemedCheckbox
                        value={selectedCheckbox === option.value}
                        onValueChange={() => onCheckboxChange(option.value)}
                    />
                <ThemedText style={{ marginLeft: 8 }}>{option.label}</ThemedText>
            </ThemedView>
            ))}
        </ThemedView>
    );
};
