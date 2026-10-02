import 'package:flutter/material.dart';
import 'package:customer_app/models/form_schema.dart';

class DynamicFormRenderer extends StatefulWidget {
  final List<FormFieldSchema> fields;
  final Map<String, dynamic> initialValues;
  final Function(Map<String, dynamic>) onChanged;
  final String? applicationId;
  final Function(String fieldKey, String fileName)? onFileUploadRequested;

  const DynamicFormRenderer({
    super.key,
    required this.fields,
    required this.initialValues,
    required this.onChanged,
    this.applicationId,
    this.onFileUploadRequested,
  });

  @override
  State<DynamicFormRenderer> createState() => _DynamicFormRendererState();
}

class _DynamicFormRendererState extends State<DynamicFormRenderer> {
  late Map<String, dynamic> _formValues;
  final Map<String, double> _uploadProgress = {};
  final Map<String, String> _uploadedFileNames = {};

  @override
  void initState() {
    super.initState();
    _formValues = Map<String, dynamic>.from(widget.initialValues);
  }

  void _updateValue(String key, dynamic value) {
    setState(() {
      _formValues[key] = value;
    });
    widget.onChanged(_formValues);
  }

  void _simulateFileUpload(String fieldKey) {
    setState(() {
      _uploadProgress[fieldKey] = 0.1;
    });

    // Simulate progress bar fill
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _uploadProgress[fieldKey] = 0.4);
    });
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) setState(() => _uploadProgress[fieldKey] = 0.8);
    });
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) {
        final sampleFileName = '${fieldKey.toLowerCase()}_document.pdf';
        setState(() {
          _uploadProgress[fieldKey] = 1.0;
          _uploadedFileNames[fieldKey] = sampleFileName;
          _formValues[fieldKey] = sampleFileName;
        });
        widget.onChanged(_formValues);
        if (widget.onFileUploadRequested != null) {
          widget.onFileUploadRequested!(fieldKey, sampleFileName);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widget.fields.map((field) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 20.0),
          child: _buildFieldWidget(field),
        );
      }).toList(),
    );
  }

  Widget _buildFieldWidget(FormFieldSchema field) {
    final key = field.fieldKey;

    switch (field.fieldType) {
      case 'NUMBER':
        return TextFormField(
          initialValue: _formValues[key]?.toString() ?? '',
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            hintText: field.placeholder,
            helperText: field.helpText,
            border: const OutlineInputBorder(),
          ),
          onChanged: (val) => _updateValue(key, double.tryParse(val) ?? val),
        );

      case 'EMAIL':
        return TextFormField(
          initialValue: _formValues[key]?.toString() ?? '',
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            hintText: field.placeholder,
            helperText: field.helpText,
            border: const OutlineInputBorder(),
          ),
          onChanged: (val) => _updateValue(key, val),
        );

      case 'PHONE':
        return TextFormField(
          initialValue: _formValues[key]?.toString() ?? '',
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            hintText: field.placeholder,
            helperText: field.helpText,
            border: const OutlineInputBorder(),
          ),
          onChanged: (val) => _updateValue(key, val),
        );

      case 'DATE':
        return TextFormField(
          readOnly: true,
          controller: TextEditingController(text: _formValues[key]?.toString() ?? ''),
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            hintText: field.placeholder ?? 'YYYY-MM-DD',
            helperText: field.helpText,
            suffixIcon: const Icon(Icons.calendar_today),
            border: const OutlineInputBorder(),
          ),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(1950),
              lastDate: DateTime(2030),
            );
            if (picked != null) {
              final formatted = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
              _updateValue(key, formatted);
            }
          },
        );

      case 'DROPDOWN':
        final options = field.options ?? [];
        final currentValue = options.contains(_formValues[key]) ? _formValues[key] : null;

        return DropdownButtonFormField<String>(
          value: currentValue,
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            helperText: field.helpText,
            border: const OutlineInputBorder(),
          ),
          items: options.map((opt) {
            return DropdownMenuItem<String>(
              value: opt,
              child: Text(opt),
            );
          }).toList(),
          onChanged: (val) => _updateValue(key, val),
        );

      case 'CHECKBOX':
        return CheckboxListTile(
          title: Text(field.isRequired ? '${field.label} *' : field.label),
          subtitle: field.helpText != null ? Text(field.helpText!) : null,
          value: _formValues[key] == true,
          onChanged: (val) => _updateValue(key, val),
          controlAffinity: ListTileControlAffinity.leading,
        );

      case 'FILE_UPLOAD':
        final isUploading = _uploadProgress.containsKey(key) && _uploadProgress[key]! < 1.0;
        final isUploaded = _uploadedFileNames.containsKey(key) || _formValues[key] != null;
        final fileName = _uploadedFileNames[key] ?? _formValues[key]?.toString();

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.upload_file, color: Color(0xFF0F172A)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      field.isRequired ? '${field.label} *' : field.label,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  if (isUploaded)
                    const Chip(
                      avatar: Icon(Icons.check_circle, color: Colors.green, size: 16),
                      label: Text('Uploaded', style: TextStyle(fontSize: 12, color: Colors.green)),
                      backgroundColor: Color(0xFFDCFCE7),
                    ),
                ],
              ),
              if (field.helpText != null) ...[
                const SizedBox(height: 4),
                Text(field.helpText!, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              ],
              const SizedBox(height: 12),
              if (isUploading) ...[
                LinearProgressIndicator(value: _uploadProgress[key]),
                const SizedBox(height: 6),
                Text('Uploading file (${(_uploadProgress[key]! * 100).toInt()}%)...', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ] else if (isUploaded) ...[
                Row(
                  children: [
                    const Icon(Icons.insert_drive_file, size: 20, color: Colors.blueGrey),
                    const SizedBox(width: 6),
                    Expanded(child: Text(fileName ?? 'document.pdf', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                    TextButton(
                      onPressed: () => _simulateFileUpload(key),
                      child: const Text('Replace'),
                    ),
                  ],
                )
              ] else ...[
                OutlinedButton.icon(
                  onPressed: () => _simulateFileUpload(key),
                  icon: const Icon(Icons.attach_file, size: 18),
                  label: const Text('Select File (PDF / JPG / PNG, Max 10MB)'),
                ),
              ]
            ],
          ),
        );

      case 'TEXT':
      default:
        return TextFormField(
          initialValue: _formValues[key]?.toString() ?? '',
          decoration: InputDecoration(
            labelText: field.isRequired ? '${field.label} *' : field.label,
            hintText: field.placeholder,
            helperText: field.helpText,
            border: const OutlineInputBorder(),
          ),
          onChanged: (val) => _updateValue(key, val),
        );
    }
  }
}
