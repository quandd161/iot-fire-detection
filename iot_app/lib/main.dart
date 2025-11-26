import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/sensor_provider.dart';
import 'screens/dashboard_screen.dart';
import 'theme/app_theme.dart';

import 'package:firebase_core/firebase_core.dart';
import 'services/fcm_service.dart';

import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // Initialize FCM
    final fcmService = FcmService();
    await fcmService.init();
  } catch (e) {
    print('Firebase initialization failed: $e');
  }
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SensorProvider()),
      ],
      child: MaterialApp(
        title: 'Gas Detection System',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme.copyWith(
          textTheme: GoogleFonts.interTextTheme(),
        ),
        home: const DashboardScreen(),
      ),
    );
  }
}
