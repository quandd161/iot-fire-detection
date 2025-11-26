import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Professional status badge widget
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spaceMedium,
        vertical: AppTheme.spaceSmall,
      ),
      decoration: AppTheme.statusBadgeDecoration(color),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: color),
            const SizedBox(width: AppTheme.spaceSmall),
          ],
          Text(
            label,
            style: AppTheme.labelMedium.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

/// Professional metric card widget
class MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String? unit;
  final String? subtitle;
  final IconData? icon;
  final Color color;
  final VoidCallback? onTap;

  const MetricCard({
    super.key,
    required this.title,
    required this.value,
    this.unit,
    this.subtitle,
    this.icon,
    this.color = AppTheme.primaryLight,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spaceLarge),
        decoration: AppTheme.cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: AppTheme.labelMedium,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (icon != null)
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spaceSmall),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    ),
                    child: Icon(icon, size: 20, color: color),
                  ),
              ],
            ),
            const SizedBox(height: AppTheme.spaceMedium),
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 24, // Reduced from 32
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
                if (unit != null) ...[
                  const SizedBox(width: AppTheme.spaceSmall),
                  Text(
                    unit!,
                    style: AppTheme.bodyMedium,
                  ),
                ],
              ],
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AppTheme.spaceSmall),
              Text(
                subtitle!,
                style: AppTheme.bodySmall,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Professional Control Card with Switch
class ControlCard extends StatelessWidget {
  final String title;
  final bool value;
  final IconData icon;
  final Color activeColor;
  final VoidCallback? onTap;
  final bool isLoading;
  final String onLabel;
  final String offLabel;

  const ControlCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.activeColor = AppTheme.successGreen,
    this.onTap,
    this.isLoading = false,
    this.onLabel = 'ON',
    this.offLabel = 'OFF',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12), // Reduced padding to fix overflow
      decoration: AppTheme.cardDecoration().copyWith(
        border: value ? Border.all(color: activeColor.withOpacity(0.3), width: 1.5) : null,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: value ? activeColor.withOpacity(0.1) : AppTheme.textTertiary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: value ? activeColor : AppTheme.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: AppTheme.labelMedium,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                value ? onLabel : offLabel,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: value ? activeColor : AppTheme.textSecondary,
                ),
              ),
              if (isLoading)
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: Padding(
                    padding: EdgeInsets.all(4.0),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else
                Transform.scale(
                  scale: 0.8,
                  child: Switch(
                    value: value,
                    onChanged: (v) => onTap?.call(),
                    activeColor: activeColor,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Professional section header widget
class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppTheme.spaceSmall),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 24, color: AppTheme.primaryLight),
            const SizedBox(width: AppTheme.spaceMedium),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTheme.headingMedium,
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: AppTheme.spaceXSmall),
                  Text(
                    subtitle!,
                    style: AppTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Professional loading indicator
class LoadingIndicator extends StatelessWidget {
  final Color? color;
  final double size;

  const LoadingIndicator({
    super.key,
    this.color,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(
            color ?? AppTheme.primaryLight,
          ),
        ),
      ),
    );
  }
}

/// Professional empty state widget
class EmptyState extends StatelessWidget {
  final String message;
  final IconData? icon;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.message,
    this.icon,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXLarge),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 64,
                color: AppTheme.textTertiary,
              ),
              const SizedBox(height: AppTheme.spaceMedium),
            ],
            Text(
              message,
              style: AppTheme.bodyMedium.copyWith(
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: AppTheme.spaceLarge),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
