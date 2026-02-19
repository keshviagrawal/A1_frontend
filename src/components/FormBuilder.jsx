import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function FormBuilder({ formFields, setFormFields, locked }) {
    const [newFieldType, setNewFieldType] = useState("text");

    const addField = () => {
        if (locked) return;
        setFormFields([
            ...formFields,
            {
                id: uuidv4(),
                type: newFieldType,
                label: "New Field",
                required: false,
                options: newFieldType === 'dropdown' ? ["Option 1", "Option 2"] : []
            }
        ]);
    };

    const removeField = (id) => {
        if (locked) return;
        setFormFields(formFields.filter(f => f.id !== id));
    };

    const updateField = (id, key, value) => {
        if (locked) return;
        setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const updateOption = (id, index, value) => {
        if (locked) return;
        const field = formFields.find(f => f.id === id);
        const newOptions = [...field.options];
        newOptions[index] = value;
        updateField(id, 'options', newOptions);
    };

    const addOption = (id) => {
        if (locked) return;
        const field = formFields.find(f => f.id === id);
        updateField(id, 'options', [...field.options, `Option ${field.options.length + 1}`]);
    };

    return (
        <div style={styles.container}>
            <h4>Custom Registration Form</h4>
            {locked && <p style={{ color: 'red' }}>⚠️ Form is locked because registrations have already started.</p>}

            {formFields.map((field, index) => (
                <div key={field.id} style={styles.fieldCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Field Type: <b>{field.type}</b></label>
                        {!locked && <button onClick={() => removeField(field.id)} style={styles.deleteBtn}>Remove</button>}
                    </div>

                    <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                        placeholder="Field Label (e.g. T-Shirt Size)"
                        disabled={locked}
                        style={styles.input}
                    />

                    <label style={{ marginLeft: '10px' }}>
                        <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                            disabled={locked}
                        /> Required
                    </label>

                    {field.type === 'dropdown' && (
                        <div style={{ marginTop: '10px', paddingLeft: '20px', borderLeft: '2px solid #ddd' }}>
                            <p>Options:</p>
                            {field.options.map((opt, i) => (
                                <div key={i} style={{ marginBottom: '5px' }}>
                                    <input
                                        value={opt}
                                        onChange={(e) => updateOption(field.id, i, e.target.value)}
                                        disabled={locked}
                                        style={styles.smallInput}
                                    />
                                </div>
                            ))}
                            {!locked && <button onClick={() => addOption(field.id)} style={styles.addOptionBtn}>+ Add Option</button>}
                        </div>
                    )}
                </div>
            ))}

            {!locked && (
                <div style={{ marginTop: '15px' }}>
                    <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} style={styles.select}>
                        <option value="text">Text Input</option>
                        <option value="number">Number Input</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        {/* <option value="file">File Upload</option> (Future) */}
                    </select>
                    <button onClick={addField} style={styles.addBtn}>+ Add Field</button>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        border: '1px solid #ccc',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        background: '#f9f9f9'
    },
    fieldCard: {
        background: '#fff',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '10px',
        border: '1px solid #eee'
    },
    input: {
        padding: '8px',
        width: '60%',
        marginTop: '5px'
    },
    smallInput: {
        padding: '5px',
        width: '50%',
        marginRight: '5px'
    },
    select: {
        padding: '8px',
        marginRight: '10px'
    },
    deleteBtn: {
        background: '#dc3545',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    addBtn: {
        background: '#28a745',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    addOptionBtn: {
        background: '#17a2b8',
        color: '#fff',
        border: 'none',
        padding: '4px 8px',
        borderRadius: '3px',
        fontSize: '0.8rem',
        cursor: 'pointer'
    }
};
