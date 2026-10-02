class FormFieldSchema {
  final String fieldKey;
  final String label;
  final String fieldType; // TEXT, NUMBER, EMAIL, PHONE, DATE, DROPDOWN, CHECKBOX, FILE_UPLOAD, MULTI_SELECT, RADIO
  final bool isRequired;
  final String? placeholder;
  final List<String>? options;
  final String? defaultValue;
  final String? helpText;
  final String? dependsOnField;
  final String? dependsOnValue;
  final String? validationRegex;

  FormFieldSchema({
    required this.fieldKey,
    required this.label,
    required this.fieldType,
    this.isRequired = false,
    this.placeholder,
    this.options,
    this.defaultValue,
    this.helpText,
    this.dependsOnField,
    this.dependsOnValue,
    this.validationRegex,
  });

  factory FormFieldSchema.fromJson(Map<String, dynamic> json) {
    return FormFieldSchema(
      fieldKey: json['fieldKey'] ?? json['key'] ?? '',
      label: json['label'] ?? '',
      fieldType: (json['fieldType'] ?? json['type'] ?? 'TEXT').toString().toUpperCase(),
      isRequired: json['isRequired'] ?? json['required'] ?? false,
      placeholder: json['placeholder'],
      options: json['options'] != null ? List<String>.from(json['options']) : null,
      defaultValue: json['defaultValue'],
      helpText: json['helpText'],
      dependsOnField: json['dependsOnField'] ?? json['dependsOn'],
      dependsOnValue: json['dependsOnValue']?.toString(),
      validationRegex: json['validationRegex'] ?? json['pattern'],
    );
  }
}

class FormStepSchema {
  final int stepNumber;
  final String title;
  final String? description;
  final List<FormFieldSchema> fields;

  FormStepSchema({
    required this.stepNumber,
    required this.title,
    this.description,
    required this.fields,
  });

  factory FormStepSchema.fromJson(Map<String, dynamic> json) {
    return FormStepSchema(
      stepNumber: json['stepNumber'] ?? 1,
      title: json['title'] ?? 'Section',
      description: json['description'],
      fields: (json['fields'] as List? ?? [])
          .map((f) => FormFieldSchema.fromJson(f))
          .toList(),
    );
  }
}
