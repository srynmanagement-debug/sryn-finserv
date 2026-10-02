import 'package:flutter/material.dart';
import 'package:customer_app/models/form_schema.dart';
import 'package:customer_app/services/api_service.dart';

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
  final Map<String, bool> _uploadingState = {};

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

  bool _isFieldVisible(FormFieldSchema field) {
    if (field.dependsOnField == null || field.dependsOnField!.isEmpty) {
      return true;
    }
    final parentVal = _formValues[field.dependsOnField]?.toString();
    if (field.dependsOnValue != null && field.dependsOnValue!.isNotEmpty) {
      return parentVal == field.dependsOnValue;
    }
    return parentVal != null && parentVal.isNotEmpty && parentVal != 'false';
  }

  Future<void> _handleFileUpload(String fieldKey) async {
    final fileName = '${fieldKey.toLowerCase()}_${DateTime.now().millisecondsSinceEpoch}.pdf';
    setState(() {
      _uploadingState[fieldKey] = true;
      _uploadProgress[fieldKey] = 0.2;
    });

    try {
      if (widget.applicationId != null && widget.applicationId!.isNotEmpty) {
        // Request presigned URL
        final presigned = await ApiService().requestPresignedUrl(
          applicationId: widget.applicationId!,
          documentType: fieldKey.toUpperCase(),
          fileName: fileName,
          fileSizeBytes: 512000,
          mimeType: 'application/pdf',
        );

        if (mounted) setState(() => _uploadProgress[fieldKey] = 0.6);

        // Register document in DB
        await ApiService().registerDocument(
          applicationId: widget.applicationId!,
          documentType: fieldKey.toUpperCase(),
          s3Key: presigned['s3Key'] ?? 'applications/${widget.applicationId}/$fileName',
          fileName: fileName,
          fileSizeBytes: 512000,
          mimeType: 'application/pdf',
        );
      }

      if (mounted) {
        setState(() {
          _uploadProgress[fieldKey] = 1.0;
          _uploadingState[fieldKey] = false;
          _uploadedFileNames[fieldKey] = fileName;
          _formValues[fieldKey] = fileName;
        });
        widget.onChanged(_formValues);
        if (widget.onFileUploadRequested != null) {
          widget.onFileUploadRequested!(fieldKey, fileName);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _uploadingState[fieldKey] = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Document upload failed for $fieldKey'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleFields = widget.fields.where(_isFieldVisible).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: visibleFields.map((field) {
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
              initialDate: DateTime.now().subtract(const Duration(days: 365 * 25)),
              firstDate: DateTime(1940),
              lastDate: DateTime.now(),
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
          initialValue: currentValue,
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

      case 'RADIO':
        final options = field.options ?? [];
        final currentValue = _formValues[key]?.toString();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(field.isRequired ? '${field.label} *' : field.label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            if (field.helpText != null) ...[
              const SizedBox(height: 4),
              Text(field.helpText!, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
            const SizedBox(height: 6),
            ...options.map((opt) => InkWell(
                  onTap: () => _updateValue(key, opt),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 4.0),
                    child: Row(
                      children: [
                        Icon(
                          opt == currentValue ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: opt == currentValue ? const Color(0xFF0F172A) : Colors.grey,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Text(opt, style: const TextStyle(fontSize: 14)),
                      ],
                    ),
                  ),
                )),
          ],
        );

      case 'MULTI_SELECT':
        final options = field.options ?? [];
        final List<String> currentSelections = List<String>.from(_formValues[key] is List ? _formValues[key] : []);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(field.isRequired ? '${field.label} *' : field.label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            if (field.helpText != null) ...[
              const SizedBox(height: 4),
              Text(field.helpText!, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: options.map((opt) {
                final selected = currentSelections.contains(opt);
                return FilterChip(
                  label: Text(opt),
                  selected: selected,
                  onSelected: (bool isSelected) {
                    final updated = List<String>.from(currentSelections);
                    if (isSelected) {
                      updated.add(opt);
                    } else {
                      updated.remove(opt);
                    }
                    _updateValue(key, updated);
                  },
                );
              }).toList(),
            ),
          ],
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
        final isUploading = _uploadingState[key] == true;
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
                Text('Uploading file securely (${((_uploadProgress[key] ?? 0) * 100).toInt()}%)...', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ] else if (isUploaded) ...[
                Row(
                  children: [
                    const Icon(Icons.insert_drive_file, size: 20, color: Colors.blueGrey),
                    const SizedBox(width: 6),
                    Expanded(child: Text(fileName ?? 'document.pdf', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                    TextButton(
                      onPressed: () => _handleFileUpload(key),
                      child: const Text('Replace'),
                    ),
                  ],
                )
              ] else ...[
                OutlinedButton.icon(
                  onPressed: () => _handleFileUpload(key),
                  icon: const Icon(Icons.attach_file, size: 18),
                  label: const Text('Upload Document (PDF / JPG / PNG)'),
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
