// Copyright 2026 TAWF Labs
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/ActivityValidator.sol";

contract ActivityValidatorTest is Test {
    ActivityValidator public validator;
    address public validator1;
    address public validator2;

    event ActivitySubmitted(bytes32 indexed activityId, string description);
    event ActivityValidated(bytes32 indexed activityId, bool isValid, bool isShariaCompliant);

    function setUp() public {
        validator = new ActivityValidator();
        validator1 = address(this);
        validator2 = address(0x2);
    }

    function testSubmitActivity() public {
        bytes32 activityId = keccak256("activity1");
        string memory description = "Halal food trade";
        string memory activityType = "trade";
        uint256 capital = 5 ether;

        vm.expectEmit(true, false, false, true);
        emit ActivitySubmitted(activityId, description);
        validator.submitActivity(activityId, description, activityType, capital);

        ActivityValidator.EconomicActivity memory activity = validator.getActivity(activityId);
        assertEq(activity.activityId, activityId);
        assertEq(activity.description, description);
        assertEq(activity.activityType, activityType);
        assertEq(activity.capitalRequired, capital);
        assertFalse(activity.isValidated);
    }

    function testValidateActivity() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Halal manufacturing", "manufacturing", 10 ether);

        vm.expectEmit(true, false, false, true);
        emit ActivityValidated(activityId, true, true);
        validator.validateActivity(activityId, true, true, true, true, "Compliant halal manufacturing");

        ActivityValidator.ValidationRecord memory record = validator.getValidation(activityId);
        assertTrue(record.isValid);
        assertTrue(record.isShariaCompliant);
        assertTrue(record.isAssetBacked);
        assertTrue(record.hasRealEconomicValue);
    }

    function testProhibitedActivities() public {
        assertFalse(validator.isShariaCompliant("alcohol"));
        assertFalse(validator.isShariaCompliant("gambling"));
        assertFalse(validator.isShariaCompliant("interest-lending"));
        assertFalse(validator.isShariaCompliant("speculation"));
        assertTrue(validator.isShariaCompliant("trade"));
        assertTrue(validator.isShariaCompliant("manufacturing"));
    }

    function testAuthorizeValidator() public {
        assertFalse(validator.authorizedValidators(validator2));

        validator.authorizeValidator(validator2);

        assertTrue(validator.authorizedValidators(validator2));
    }

    function testAddProhibitedActivity() public {
        string memory newProhibited = "payday-lending";

        assertTrue(validator.isShariaCompliant(newProhibited));

        validator.addProhibitedActivity(newProhibited);

        assertFalse(validator.isShariaCompliant(newProhibited));
    }

    function testMeetsShariaCompliance() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Halal services", "services", 5 ether);

        assertFalse(validator.meetsShariaCompliance(activityId));

        validator.validateActivity(activityId, true, true, true, true, "Fully compliant");

        assertTrue(validator.meetsShariaCompliance(activityId));
    }

    function testRejectNonCompliantActivity() public {
        bytes32 activityId = keccak256("activity1");
        validator.submitActivity(activityId, "Interest-based lending", "interest-lending", 5 ether);

        validator.validateActivity(activityId, false, false, false, false, "Non-Sharia-compliant");

        ActivityValidator.ValidationRecord memory record = validator.getValidation(activityId);
        assertFalse(record.isValid);
        assertFalse(record.isShariaCompliant);
        assertFalse(validator.meetsShariaCompliance(activityId));
    }
}
