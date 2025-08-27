@@ .. @@
 CREATE POLICY "Organisation members can read assessments"
   ON assessments
   FOR SELECT
   TO authenticated
   USING (EXISTS (
     SELECT 1 FROM organisation_members
     WHERE organisation_members.organisation_id = assessments.organisation_id
     AND organisation_members.user_id = auth.uid()
     AND organisation_members.status = 'active'
   ));

+CREATE POLICY "Authenticated users can create assessments"
+  ON assessments
+  FOR INSERT
+  TO authenticated
+  WITH CHECK (auth.uid() = created_by);
+
 -- Assessment responses table