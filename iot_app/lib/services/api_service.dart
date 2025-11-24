import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants.dart';

class ApiService {
  Future<Map<String, dynamic>> getData() async {
    try {
      final response = await http.get(Uri.parse('${AppConstants.baseUrl}/api/data'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await http.get(Uri.parse('${AppConstants.baseUrl}/api/notifications'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  Future<void> controlRelay1(bool state) async {
    await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/control/relay1'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'state': state}),
    );
  }

  Future<void> controlRelay2(bool state) async {
    await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/control/relay2'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'state': state}),
    );
  }

  Future<void> controlWindow(bool state) async {
    await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/control/window'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'state': state}),
    );
  }

  Future<void> setMode(String mode) async {
    await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/control/mode'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'mode': mode}),
    );
  }

  Future<void> setThreshold(int threshold) async {
    await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/control/threshold'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'threshold': threshold}),
    );
  }
}
